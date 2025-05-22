import React, { useState, useEffect } from "react";
// Assuming Card, CardContent, Button, Loading are correctly imported or defined elsewhere

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
  <div className="flex justify-center items-center h-screen"> {/* Full screen loading initially */}
    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
    <p className="ml-4 text-lg text-gray-700">Жүктелуде...</p>
  </div>
);

const ErrorDisplay = ({ message }) => ( // This is for critical errors like product fetch failure
    <div className="p-4 max-w-md mx-auto text-center mt-10">
      <div className="text-red-700 text-lg p-6 border-2 border-red-500 rounded-xl bg-red-50 shadow-lg">
          <p className="font-bold text-xl mb-2">🚨 Қате!</p>
          <p>{message}</p>
          <Button onClick={() => window.location.reload()} className="mt-6 bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 text-base">
              Бетті қайта жүктеу
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

// Placeholder QR Code URL - REPLACE THIS WITH YOUR ACTUAL QR CODE IMAGE URL
const PAYMENT_QR_CODE_URL = "https://placehold.co/300x300/E2E8F0/94A3B8?text=QR+CODE+%C3%9CRNEGI%0A(Kaspi%2C+Halyk+etc)";


export default function WebAppShop() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [page, setPage] = useState("catalog");  // "catalog", "cart", "contactInfo", "address", "confirm", "qrPayment"
  const [contactDetails, setContactDetails] = useState({ fullName: "", phoneNumber: "", telegramUserID: "" });
  const [address, setAddress] = useState({ city: "", street: "", entrance: "", floor: "", flat: "" });
  const [animateAdd, setAnimateAdd] = useState(null);
  const [appLoading, setAppLoading] = useState(true); 
  const [error, setError] = useState(null); 
  const [userWarning, setUserWarning] = useState(null); 
  const [user, setUser] = useState(null); 
  const [enhancingProductId, setEnhancingProductId] = useState(null);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false); // For payment submission loading state


  const fetchProducts = async () => {
    try {
      const response = await fetch("https://opensheet.elk.sh/1O03ib-iT4vTpJEP5DUOawv96NvQPiirhQSudNEBAtQk/Sheet1");
      if (!response.ok) {
          throw new Error(`HTTP error ${response.status} while fetching products`);
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
      return true; 
    } catch (err) {
      console.error("Fetch products error:", err);
      setError("Өнімдерді жүктеу кезінде маңызды қате пайда болды. Интернет байланысыңызды тексеріп, бетті қайта жүктеп көріңіз.");
      return false; 
    }
  };

  useEffect(() => {
    const initializeApp = async () => {
        setAppLoading(true);
        setError(null);
        setUserWarning(null);

        const productsFetched = await fetchProducts();

        if (typeof window !== "undefined" && window.Telegram?.WebApp) {
            try {
                console.log("Attempting to initialize Telegram WebApp...");
                window.Telegram.WebApp.ready();
                window.Telegram.WebApp.expand(); 

                const initDataUnsafe = window.Telegram.WebApp.initDataUnsafe;
                console.log("Telegram.WebApp.initDataUnsafe:", initDataUnsafe);

                if (initDataUnsafe?.user?.id) { 
                    const tgUser = {
                        id: ensureStringForRender(initDataUnsafe.user.id, 'user.id_telegram'),
                        username: ensureStringForRender(initDataUnsafe.user.username, 'user.username_telegram', "(Анықталмаған)")
                    };
                    setUser(tgUser);
                    setContactDetails(prevDetails => ({
                        ...prevDetails,
                        telegramUserID: prevDetails.telegramUserID || tgUser.id 
                    }));
                    console.log("User data successfully retrieved from Telegram:", tgUser);
                } else {
                    setUser(null); 
                    console.warn("Telegram user data (ID) not found in initDataUnsafe. Proceeding as anonymous within Telegram context.");
                    setUserWarning("Telegram пайдаланушы ID-і табылмады. Тапсырыстар \"аноним\" ретінде жіберілуі мүмкін.");
                }
            } catch (e) {
                console.error("Error during Telegram WebApp initialization:", e);
                setUser(null); 
                setUserWarning("Telegram WebApp жүйесін инициализациялау кезінде қате. Қосымша Telegramсыз жұмыс істейді.");
            }
        } else {
            console.warn("Telegram WebApp context not found. The app will run without Telegram-specific features.");
            setUser(null);
            setUserWarning("Telegram WebApp контексті табылмады. Қосымша Telegramсыз жұмыс істейді, бірақ кейбір мүмкіндіктер шектеулі болуы мүмкін.");
        }
        
        if (!productsFetched && !error) { 
            setError("Қосымшаны инициализациялау кезінде белгісіз қате.");
        }
        setAppLoading(false);
    };

    initializeApp();
  }, []);


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

  const handleContactDetailsChange = (e) => {
    const { name, value } = e.target;
    setContactDetails(prev => ({ ...prev, [name]: value }));
  };

  const handleProceedToAddress = () => {
    if (!contactDetails.fullName.trim()) {
        alert("Аты-жөніңізді енгізіңіз.");
        return;
    }
    if (!contactDetails.phoneNumber.trim()) {
        alert("Телефон нөміріңізді енгізіңіз.");
        return;
    }
    console.log("Contact details confirmed:", contactDetails);
    setPage("address");
  };
  
  const handleConfirmAddress = () => {
    if (!address.city.trim() || !address.street.trim()) {
        alert("Қала және Көше, үй нөмірі өрістері міндетті.");
        return;
    }
    console.log("Address confirmed:", address);
    setPage("confirm");
  };

  const proceedToQrPayment = () => {
    setPage("qrPayment");
  };

  const handleOrderSubmission = async () => {
    setIsSubmittingOrder(true);
    const orderTotal = cart.reduce((sum, p) => sum + p.price, 0);
    // Validation is already done before this point, but good to have a quick check
    if (cart.length === 0) {
        alert("Себет бос."); // Should not happen if flow is correct
        setIsSubmittingOrder(false);
        return;
    }

    const clientSideOrderId = `WEBAPP-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const order = {
      clientOrderId: clientSideOrderId,
      userContext: { 
        id: user?.id || "Контексттен алынбады", 
        username: user?.username || "Контексттен алынбады"
      },
      contactInfo: contactDetails, 
      deliveryAddress: address, 
      products: cart,
      total: orderTotal,
      orderTimestamp: new Date().toISOString()
    };

    console.log("Sending order to webhook:", order);

    try {
      const res = await fetch("https://alphabotai.app.n8n.cloud/webhook-test/49eb5226-ed25-40e6-a3fc-272616c5a1a0", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(order),
      });

      if (res.ok) {
        alert(`✅ Тапсырыс №${clientSideOrderId} сәтті жіберілді! Тапсырыс статусы туралы Telegram ботынан хабарлама күтіңіз.`);
        setCart([]); 
        setContactDetails({ fullName: "", phoneNumber: "", telegramUserID: "" }); 
        setAddress({ city: "", street: "", entrance: "", floor: "", flat: "" }); 
        setPage("catalog"); 
      } else {
        const errorText = await res.text();
        alert(`❌ Сервер жауап қатпады. Статус: ${res.status}. Қате: ${errorText}`);
      }
    } catch (err) {
      alert("⚠️ Тапсырысты жіберу кезінде қате: " + err.message);
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  if (appLoading) { 
      return <Loading />;
  }

  if (error) { 
      return <ErrorDisplay message={error} />;
  }


  return (
    <div className="p-4 space-y-4 max-w-md mx-auto pb-20">
      {userWarning && page === "catalog" && ( 
         <div className="p-3 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 rounded-md text-sm mb-4 shadow">
            <p><span className="font-bold">Ескерту:</span> {userWarning}</p>
         </div>
      )}

      {page === "catalog" && (
        <div className="space-y-4"> 
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
              <Button onClick={() => {
                  if (cart.length === 0) {
                      alert("Себет бос. Алдымен өнім қосыңыз.");
                      return;
                  }
                  setPage("contactInfo");
              }} 
              className="w-full bg-black text-white rounded-xl py-3 text-lg relative shadow-lg">
                Себетке өту ({cart.length})
              </Button>
            </div>
          )}
           {products.length === 0 && !appLoading && !error && ( 
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
              <Button onClick={() => setPage("contactInfo")} className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl py-3 text-lg">📝 Байланыс ақпараты</Button>
            </>
          )}
        </motion.div>
      )}

      {page === "contactInfo" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Байланыс ақпараты</h2>
            <Button variant="ghost" onClick={() => setPage("cart")} className="text-blue-600 hover:bg-blue-50">← Себет</Button>
          </div>
          <p className="text-sm text-gray-600">Тапсырысты растау және жеткізу үшін қажетті ақпаратты енгізіңіз.</p>
          <input
            type="text" name="fullName" placeholder="Аты-жөніңіз *"
            className="w-full p-3 rounded-xl border bg-white text-black focus:ring-2 focus:ring-blue-500 outline-none"
            value={contactDetails.fullName} onChange={handleContactDetailsChange}
          />
          <input
            type="tel" name="phoneNumber" placeholder="Телефон нөміріңіз *"
            className="w-full p-3 rounded-xl border bg-white text-black focus:ring-2 focus:ring-blue-500 outline-none"
            value={contactDetails.phoneNumber} onChange={handleContactDetailsChange}
          />
          <div>
            <label htmlFor="telegramUserID" className="block text-sm font-medium text-gray-700 mb-1">Telegram UserID (міндетті емес)</label>
            <input
              type="text" name="telegramUserID" id="telegramUserID" placeholder="Сіздің Telegram UserID"
              className="w-full p-3 rounded-xl border bg-white text-black focus:ring-2 focus:ring-blue-500 outline-none"
              value={contactDetails.telegramUserID} onChange={handleContactDetailsChange}
            />
            <p className="mt-1 text-xs text-gray-500">
              UserID-іңізді білмесеңіз, Telegram-да <a href="https://t.me/userinfobot" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">@userinfobot</a>-қа `/start` деп жазып біле аласыз. Бұл бізге сізбен байланысуға көмектеседі.
            </p>
          </div>
          <Button onClick={handleProceedToAddress} className="w-full bg-blue-700 hover:bg-blue-800 text-white rounded-xl py-3 text-lg mt-2">
            Келесі: Адрес енгізу
          </Button>
        </motion.div>
      )}

      {page === "address" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Жеткізу адресі</h2>
            <Button variant="ghost" onClick={() => setPage("contactInfo")} className="text-blue-600 hover:bg-blue-50">← Байланыс</Button>
          </div>
          <p className="text-sm text-gray-600">Толық жеткізу адресін енгізіңіз:</p>
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
            Тапсырысты растауға өту
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
            <p className="font-semibold text-md">Байланыс ақпараты:</p>
            <p><span className="font-medium">Аты-жөні:</span> {contactDetails.fullName}</p>
            <p><span className="font-medium">Телефон:</span> {contactDetails.phoneNumber}</p>
            {contactDetails.telegramUserID && <p><span className="font-medium">Telegram UserID (енгізілген):</span> {contactDetails.telegramUserID}</p>}
            <p className="text-xs text-gray-500 mt-0.5">Telegram контекстінен: @{user?.username || "анықталмаған"} (ID: {user?.id || "анықталмаған"})</p>
          </div>
          <hr className="my-2"/>
          <div className="space-y-1 text-sm">
            <p className="font-semibold text-md">Жеткізу адресі:</p>
            <p><span className="font-medium">Қала:</span> {address.city}</p>
            <p><span className="font-medium">Көше, үй:</span> {address.street}</p>
            {address.entrance && <p><span className="font-medium">Кіреберіс:</span> {address.entrance}</p>}
            {address.floor && <p><span className="font-medium">Қабат:</span> {address.floor}</p>}
            {address.flat && <p><span className="font-medium">Пәтер:</span> {address.flat}</p>}
          </div>
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
          
          <Button onClick={proceedToQrPayment} className="w-full bg-purple-700 hover:bg-purple-800 text-white rounded-xl py-3 text-lg mt-3">
            Төлеу және тапсырыс беру
          </Button>
        </motion.div>
      )}

      {page === "qrPayment" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 bg-gray-50 p-6 rounded-xl shadow-lg text-center">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-gray-800">Төлем</h2>
                <Button variant="ghost" onClick={() => setPage("confirm")} className="text-blue-600 hover:bg-blue-50 text-sm">← Растауға оралу</Button>
            </div>
            <p className="text-gray-700">Төмендегі QR кодты Kaspi.kz немесе басқа банк қосымшасы арқылы сканерлеп, төлем жасаңыз.</p>
            <div className="flex justify-center my-4">
                <img 
                    src={PAYMENT_QR_CODE_URL} 
                    alt="Төлем QR коды" 
                    className="w-64 h-64 md:w-72 md:h-72 border-4 border-gray-300 rounded-lg shadow-md"
                    onError={(e) => {
                        e.currentTarget.alt = 'QR кодты жүктеу мүмкін болмады';
                        e.currentTarget.parentNode.innerHTML = '<p class="text-red-500">QR кодты жүктеу мүмкін болмады. Басқа төлем әдісін қолданыңыз немесе әкімшімен хабарласыңыз.</p>';
                    }}
                />
            </div>
            <p className="text-xl font-bold text-gray-800">Төлеуге: {cart.reduce((sum, p) => sum + p.price, 0)} ₸</p>
            <p className="text-xs text-gray-500 mt-2 mb-4">Төлем жасағаннан кейін, төмендегі батырманы басып, тапсырысыңызды растаңыз.</p>
            <Button 
                onClick={handleOrderSubmission} 
                disabled={isSubmittingOrder}
                className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl py-3 text-lg"
            >
              {isSubmittingOrder ? "Жіберілуде..." : "✅ Мен төледім, тапсырысты жіберу"}
            </Button>
        </motion.div>
      )}
    </div>
  );
}
