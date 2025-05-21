import React, { useState, useEffect } from "react";
// Assuming Card, CardContent, Button, Loading are correctly imported or defined elsewhere
// For this example, I'll use the placeholder definitions you provided if they were in the prompt.
// If they are from "@/components/ui/...", ensure that path is correct and components are exported.

// Placeholder UI components (if not imported from a UI library)
const Card = ({ className, children }) => <div className={`border rounded-lg shadow ${className}`}>{children}</div>;
const CardContent = ({ className, children }) => <div className={`p-4 ${className}`}>{children}</div>;
const Button = ({ className, children, onClick, as, href, variant, disabled }) => {
  const Tag = as || 'button';
  return (
    <Tag
      className={`px-4 py-2 rounded-md font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 ${className} ${variant === 'ghost' ? 'hover:bg-gray-100' : 'bg-blue-500 text-white hover:bg-blue-600'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={onClick}
      href={href}
      disabled={disabled}
    >
      {children}
    </Tag>
  );
};
const Loading = () => (
  <div className="flex justify-center items-center h-32"> {/* Adjusted height for inline loading */}
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    <p className="ml-3 text-gray-700">Жүктелуде...</p>
  </div>
);

const ErrorDisplay = ({ message }) => (
    <div className="p-4 max-w-md mx-auto text-center">
      <div className="text-red-700 text-lg p-4 border border-red-500 rounded-md bg-red-100">
          <p className="font-semibold">Қате:</p>
          <p>{message}</p>
          <Button onClick={() => window.location.reload()} className="mt-4 bg-red-600 hover:bg-red-700 text-white">
              Қайта жүктеу
          </Button>
      </div>
    </div>
  );


import { motion } from "framer-motion";

// Helper function to safely convert values to strings for rendering
const ensureStringForRender = (value, fieldName = 'unknown field', defaultValue = '') => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (value === null || typeof value === 'undefined') return defaultValue;

  if (typeof value === 'object' && value !== null && value.$$typeof === Symbol.for('react.element')) {
    console.error(`CRITICAL_ERROR_DETECTED: ensureStringForRender received a React element for field "${fieldName}". Placeholder returned. Value:`, value);
    return `[!!! React Element for ${fieldName} !!!]`;
  }

  if (typeof value === 'object' && value !== null) {
    console.warn(`[ensureStringForRender] Warning: Field "${fieldName}" is a generic object. Placeholder returned. Value:`, value);
    return `[OBJ]`;
  }
  
  try {
    return String(value);
  } catch (e) {
    console.error(`[ensureStringForRender] Error stringifying value for field ${fieldName}:`, e, "Value:", value);
    return defaultValue;
  }
};

export default function WebAppShop() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [page, setPage] = useState("catalog");
  const [address, setAddress] = useState({ city: "", street: "", entrance: "", floor: "", flat: "" });
  const [animateAdd, setAnimateAdd] = useState(null);
  const [loading, setLoading] = useState(true); // For product loading
  const [error, setError] = useState(null); // For critical errors (no products, not in Telegram)
  const [userWarning, setUserWarning] = useState(null); // For non-critical warnings (no user details)
  const [user, setUser] = useState(null); // Initialize user as null
  const [enhancingProductId, setEnhancingProductId] = useState(null);

  // ✅ Өнімдерді жүктеу
  const fetchProducts = async () => {
    setLoading(true); 
    setError(null); 
    try {
      const response = await fetch("https://opensheet.elk.sh/1O03ib-iT4vTpJEP5DUOawv96NvQPiirhQSudNEBAtQk/Sheet1");
      if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
      }
      const data = await response.json();
      if (!Array.isArray(data)) {
          console.error("Fetched data is not an array:", data);
          throw new Error("Өнім деректері жарамсыз форматта келді.");
      }

      const formatted = data.map((item, index) => {
        const rawImageURL = ensureStringForRender(item.imageURL, `item[${index}].imageURL_raw`, '');
        const isDriveLink = rawImageURL.includes("drive.google.com");
        let imageURL = rawImageURL;

        if (isDriveLink) {
          try {
            const parts = rawImageURL.split("/d/");
            if (parts.length > 1) {
              const idPart = parts[1].split("/")[0];
              imageURL = `https://drive.google.com/uc?export=view&id=${idPart}`;
            } else {
              console.warn(`Could not parse Google Drive URL (item index ${index}):`, rawImageURL);
              imageURL = ''; 
            }
          } catch (splitError) {
            console.error(`Error parsing Google Drive URL (item index ${index}):`, rawImageURL, splitError);
            imageURL = ''; 
          }
        }
        
        return {
          id: ensureStringForRender(item.id || crypto.randomUUID(), `item[${index}].id`),
          name: ensureStringForRender(item.name, `item[${index}].name`, "Атауы жоқ"),
          imageURL: ensureStringForRender(imageURL, `item[${index}].imageURL_final`),
          price: parseInt(item.price, 10) || 0, 
          description: ensureStringForRender(item.description, `item[${index}].description`, "Сипаттамасы жоқ"),
          stock: ensureStringForRender(item.stock, `item[${index}].stock`), 
          size: ensureStringForRender(item.size, `item[${index}].size`),   
          enhancedDescription: null, 
        };
      });

      setProducts(formatted);
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Өнімдерді жүктеу кезінде қате пайда болды. Бетті қайта жүктеп көріңіз."); // More specific error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();

    if (typeof window !== "undefined" && window.Telegram?.WebApp) {
      try {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand(); 

        const initDataUnsafe = window.Telegram.WebApp.initDataUnsafe;
        console.log("Telegram initDataUnsafe:", initDataUnsafe);

        if (initDataUnsafe?.user?.id) { // Check for user.id specifically
          setUser({
            id: ensureStringForRender(initDataUnsafe.user.id, 'user.id_telegram'),
            username: ensureStringForRender(initDataUnsafe.user.username, 'user.username_telegram', "(Анықталмаған)")
          });
          setUserWarning(null); // Clear warning if user data is found
          console.log("User data successfully retrieved:", initDataUnsafe.user);
        } else {
          setUser(null); // Explicitly set user to null
          console.warn("❌ Telegram user data not found or incomplete in initDataUnsafe.");
          setUserWarning("Telegram пайдаланушы ақпараты табылмады. Тапсырыстар \"аноним\" ретінде жіберіледі. Толыққанды жұмыс үшін бот арқылы дұрыс кіргеніңізді тексеріңіз.");
        }
      } catch (e) {
          console.error("Error during Telegram WebApp initialization:", e);
          setUser(null);
          setError("Telegram WebApp жүйесін инициализациялау кезінде қате пайда болды. Telegram ішінде ашқаныңызға көз жеткізіңіз.");
      }
    } else {
      console.warn("❌ Telegram WebApp context not found. App may not function correctly outside Telegram.");
      setUser(null);
      setError("Бұл дүкенді Telegram боты арқылы ашыңыз. Қазіргі ортада Telegram WebApp мүмкіндіктері қолжетімсіз.");
    }
  }, []);


  // Gemini API Function
  const handleEnhanceDescription = async (productId) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    setEnhancingProductId(productId);
    try {
      const prompt = `Enhance this product description for an e-commerce store. Make it more appealing, highlight key features, and encourage purchase. Keep it concise (2-3 sentences). Product Name: "${product.name}". Current Description: "${product.description}"`;
      
      let chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
      const payload = { contents: chatHistory };
      const apiKey = ""; 
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
      
      const response = await fetch(apiUrl, {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify(payload)
             });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Gemini API request failed with status ${response.status}: ${errorBody}`);
      }
      
      const result = await response.json();

      if (result.candidates && result.candidates.length > 0 &&
          result.candidates[0].content && result.candidates[0].content.parts &&
          result.candidates[0].content.parts.length > 0) {
        const enhancedText = result.candidates[0].content.parts[0].text;
        setProducts(prevProducts =>
          prevProducts.map(p =>
            p.id === productId
              ? { ...p, enhancedDescription: enhancedText.trim() }
              : p
          )
        );
      } else {
        console.error("Unexpected response structure from Gemini API:", result);
        throw new Error("Failed to get enhanced description from Gemini API due to unexpected response structure.");
      }
    } catch (e) {
      console.error("Error enhancing description:", e);
      alert(`Сипаттаманы жақсарту мүмкін болмады: ${e.message}`);
    } finally {
      setEnhancingProductId(null);
    }
  };

  const addToCart = (product) => {
    setCart((prev) => [...prev, product]);
    setAnimateAdd(product.id);
    setTimeout(() => setAnimateAdd(null), 500);
  };

  const handleConfirmAddress = () => {
    console.log("Confirmed address:", address);
    if (!address.city.trim() || !address.street.trim()) {
        alert("Қала және Көше, үй нөмірі өрістері міндетті.");
        return;
    }
    setPage("confirm");
  };

  const handlePayment = async () => {
    const orderTotal = cart.reduce((sum, p) => sum + p.price, 0);
    if (orderTotal <= 0 && cart.length > 0) {
        alert("Тапсырыс сомасы жарамсыз. Өнім бағаларын тексеріңіз.");
        return;
    }
    if (cart.length === 0) {
        alert("Себет бос. Тапсырыс беру үшін өнім қосыңыз.");
        return;
    }

    const order = {
      user: {
        id: user?.id || "аноним", // Fallback to "аноним" if user or user.id is null/undefined
        username: user?.username || "аноним" // Fallback for username
      },
      address,
      products: cart,
      total: orderTotal,
    };

    try {
      const res = await fetch("https://alphabotai.app.n8n.cloud/webhook-test/49eb5226-ed25-40e6-a3fc-272616c5a1a0", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(order),
      });

      if (res.ok) {
        alert("✅ Тапсырыс жіберілді!");
        setCart([]); 
        setPage("catalog"); 
      } else {
        const errorText = await res.text();
        alert(`❌ Сервер жауап қатпады. Статус: ${res.status}. Қате: ${errorText}`);
      }
    } catch (err) {
      alert("⚠️ Қате: " + err.message);
    }
  };

  if (loading) {
      return <Loading />;
  }

  if (error) { // Critical error (e.g., not in Telegram, products failed to load)
      return <ErrorDisplay message={error} />;
  }


  return (
    <div className="p-4 space-y-4 max-w-md mx-auto pb-20">
      {userWarning && !error && page === "catalog" && (
         <div className="p-3 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 rounded-md text-sm mb-4 shadow">
            <p><span className="font-bold">Назар аударыңыз:</span> {userWarning}</p>
         </div>
      )}

      {page === "catalog" && (
        <div className="space-y-4"> 
          {/* Loading and error for products are handled above the main return now */}
          {products.map((product) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="shadow-xl rounded-2xl overflow-hidden">
                <CardContent className="p-4 space-y-2">
                  <img
                    src={product.imageURL}
                    alt={product.name}
                    className="w-full h-48 object-cover rounded-xl border" 
                    onError={(e) => {
                        e.currentTarget.src = 'https://placehold.co/600x400/E2E8F0/94A3B8?text=Сурет+жоқ';
                        e.currentTarget.alt = 'Сурет жүктелмеді';
                    }}
                  />
                  <div className="text-xl font-bold text-gray-800">{product.name}</div>
                  <p className="text-gray-600 text-sm min-h-[3em]">{product.description}</p>
                  
                  {product.enhancedDescription && (
                    <div className="mt-2 p-2 bg-purple-50 border border-purple-200 rounded-md">
                        <p className="text-sm text-purple-700">
                            <span className="font-semibold">✨ AI Жақсартқан Сипаттама:</span> {product.enhancedDescription}
                        </p>
                    </div>
                  )}

                  <div className="text-lg font-semibold text-green-600 mt-1">{product.price} ₸</div>
                  
                  <motion.div className="mt-2" whileTap={{ scale: 0.98 }}>
                     <Button 
                        onClick={() => handleEnhanceDescription(product.id)}
                        disabled={enhancingProductId === product.id || !!product.enhancedDescription}
                        className="w-full rounded-lg text-xs py-1.5 bg-purple-500 hover:bg-purple-600 text-white"
                    >
                      {enhancingProductId === product.id ? "✨ Жақсартуда..." : product.enhancedDescription ? "✓ Жақсартылған" : "✨ Сипаттаманы AI-мен жақсарту"}
                    </Button>
                  </motion.div>

                  <motion.div
                    whileTap={{ scale: 0.98 }} 
                    animate={animateAdd === product.id ? { scale: [1, 1.05, 1] } : {}} 
                    transition={{ duration: 0.3 }}
                    className="mt-1"
                  >
                    <Button onClick={() => addToCart(product)} className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white py-2.5"> 
                      Себетке қосу
                    </Button>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          ))}

          {products.length > 0 && ( 
            <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 w-[calc(100%-2rem)] max-w-md z-50"> 
              <Button onClick={() => setPage("cart")} className="w-full bg-black text-white rounded-xl py-3 text-lg relative shadow-lg">
                Себетке өту
                {cart.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {cart.length}
                  </span>
                )}
              </Button>
            </div>
          )}
           {products.length === 0 && ( // Show this if no products and no error/loading
             <div className="text-center text-gray-500 py-10">Өнімдер табылмады.</div>
           )}
        </div>
      )}

      {page === "cart" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Себет</h2>
            <Button variant="ghost" onClick={() => setPage("catalog")} className="text-blue-600 hover:bg-blue-50">← Каталог</Button>
          </div>
          {cart.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Себетіңіз бос.</p>
          ) : (
            cart.map((item, idx) => (
              <div key={idx} className="border p-3 rounded-xl bg-white shadow flex justify-between items-center">
                <div>
                    <span className="font-medium">{item.name}</span> — <span className="font-semibold">{item.price} ₸</span>
                </div>
              </div>
            ))
          )}
          {cart.length > 0 && (
            <>
              <div className="font-bold text-right text-xl mt-4">Жалпы: {cart.reduce((sum, p) => sum + p.price, 0)} ₸</div>
              <Button onClick={() => setPage("address")} className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl py-3 text-lg">📍 Адрес енгізу</Button>
            </>
          )}
        </motion.div>
      )}

      {page === "address" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Адрес енгізу</h2>
            <Button variant="ghost" onClick={() => setPage("cart")} className="text-blue-600 hover:bg-blue-50">← Себет</Button>
          </div>
          <p className="text-sm text-gray-600">Толық адрес мәліметтеріңізді енгізіңіз:</p>
          <input
            type="text" placeholder="Қала *"
            className="w-full p-3 rounded-xl border bg-white text-black focus:ring-2 focus:ring-blue-500 outline-none"
            value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })}
          />
          <input
            type="text" placeholder="Көше, үй нөмірі *"
            className="w-full p-3 rounded-xl border bg-white text-black focus:ring-2 focus:ring-blue-500 outline-none"
            value={address.street} onChange={(e) => setAddress({ ...address, street: e.target.value })}
          />
          <input
            type="text" placeholder="Кіреберіс (подъезд)"
            className="w-full p-3 rounded-xl border bg-white text-black focus:ring-2 focus:ring-blue-500 outline-none"
            value={address.entrance} onChange={(e) => setAddress({ ...address, entrance: e.target.value })}
          />
          <input
            type="text" placeholder="Қабат (этаж)"
            className="w-full p-3 rounded-xl border bg-white text-black focus:ring-2 focus:ring-blue-500 outline-none"
            value={address.floor} onChange={(e) => setAddress({ ...address, floor: e.target.value })}
          />
          <input
            type="text" placeholder="Пәтер (егер бар болса)"
            className="w-full p-3 rounded-xl border bg-white text-black focus:ring-2 focus:ring-blue-500 outline-none"
            value={address.flat} onChange={(e) => setAddress({ ...address, flat: e.target.value })}
          />
          <Button onClick={handleConfirmAddress} className="w-full bg-blue-700 hover:bg-blue-800 text-white rounded-xl py-3 text-lg mt-2">
            Растау
          </Button>
        </motion.div>
      )}

      {page === "confirm" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3 bg-gray-50 p-4 rounded-xl shadow">
           <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Тапсырысты растау</h2>
            <Button variant="ghost" onClick={() => setPage("address")} className="text-blue-600 hover:bg-blue-50">← Адрес</Button>
          </div>
          <div className="space-y-1 text-sm">
            <p><span className="font-medium">Қала:</span> {address.city}</p>
            <p><span className="font-medium">Көше, үй:</span> {address.street}</p>
            {address.entrance && <p><span className="font-medium">Кіреберіс:</span> {address.entrance}</p>}
            {address.floor && <p><span className="font-medium">Қабат:</span> {address.floor}</p>}
            {address.flat && <p><span className="font-medium">Пәтер:</span> {address.flat}</p>}
          </div>
          <hr className="my-2"/>
          <div className="text-sm text-gray-600">Пайдаланушы: @{user?.username || "аноним"} (ID: {user?.id || "аноним"})</div>
          <hr className="my-2"/>
          <p className="font-semibold text-md">Тауарлар:</p>
          {cart.map((item, idx) => (
            <div key={idx} className="text-sm flex justify-between">
              <span>{item.name}</span>
              <span>{item.price} ₸</span>
            </div>
          ))}
          <hr className="my-2"/>
          <div className="font-bold text-right text-xl">Жалпы: {cart.reduce((sum, p) => sum + p.price, 0)} ₸</div>
          <Button onClick={handlePayment} className="w-full bg-purple-700 hover:bg-purple-800 text-white rounded-xl py-3 text-lg mt-3">
            Төлемге өту
          </Button>
        </motion.div>
      )}
    </div>
  );
}
