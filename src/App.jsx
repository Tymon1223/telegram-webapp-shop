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

// URL for your Google Apps Script Web App
const APPS_SCRIPT_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwLSMYSH2s3uG3CvKOzDXTmaFcA2AoN5J3EPCVHTZXCNszQeZJTh2-UwQoeTPUkO6oI/exec'; // СІЗ БЕРГЕН APPS SCRIPT URL
const N8N_ADMIN_NOTIFICATION_WEBHOOK_URL = "https://alphabotai.app.n8n.cloud/webhook-test/49eb5226-ed25-40e6-a3fc-272616c5a1a0"; // For admin notifications (optional)

const availableColors = [
    { name: "Қызыл", value: "red", hex: "#EF4444" },
    { name: "Көк", value: "blue", hex: "#3B82F6" },
    { name: "Жасыл", value: "green", hex: "#22C55E" },
    { name: "Қара", value: "black", hex: "#000000" },
    { name: "Ақ", value: "white", hex: "#FFFFFF" },
    { name: "Сұр", value: "grey", hex: "#6B7280" },
    { name: "Сары", value: "yellow", hex: "#F59E0B" },
    { name: "Қызғылт", value: "pink", hex: "#EC4899" },
];


export default function WebAppShop() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [page, setPage] = useState("catalog");  // "catalog", "cart", "contactInfo", "address", "confirm", "paymentMethod"
  const [contactDetails, setContactDetails] = useState({ fullName: "", phoneNumber: "", telegramUserID: "" });
  const [address, setAddress] = useState({ city: "", street: "", entrance: "", floor: "", flat: "" });
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("card"); // "card" or "kaspi"
  // selectedProductColor state removed
  const [animateAdd, setAnimateAdd] = useState(null);
  const [appLoading, setAppLoading] = useState(true); 
  const [error, setError] = useState(null); 
  const [userWarning, setUserWarning] = useState(null); 
  const [user, setUser] = useState(null); 
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false); 


  const fetchProducts = async () => {
    try {
      const productsSheetUrl = `https://opensheet.elk.sh/1O03ib-iT4vTpJEP5DUOawv96NvQPiirhQSudNEBAtQk/Sheet1`; 
      console.log("Fetching products from:", productsSheetUrl);
      const response = await fetch(productsSheetUrl);
      if (!response.ok) {
          throw new Error(`HTTP error ${response.status} while fetching products`);
      }
      const data = await response.json();
      if (!Array.isArray(data)) {
          console.error("Fetched product data is not an array:", data);
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
          selectedColor: "", // Initialize selectedColor for each product
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

  const handleProductColorSelect = (productId, colorValue) => {
    setProducts(prevProducts =>
        prevProducts.map(p =>
            p.id === productId ? { ...p, selectedColor: colorValue } : p
        )
    );
  };

  const addToCart = (product) => {
    // Find the product from the current products state to get its selectedColor
    const currentProductState = products.find(p => p.id === product.id);
    if (!currentProductState?.selectedColor) { 
        alert(`"${product.name}" үшін өң таңдаңыз.`);
        return;
    }
    // Add product with its selected color to cart
    // Ensure quantity is handled if products can be added multiple times or if cart manages quantity
    const cartItem = { 
        ...currentProductState, // This includes id, name, price, imageURL, description, size, and selectedColor
        quantity: 1 // Assuming each add to cart is a new item or you handle quantity aggregation elsewhere
    };
    setCart((prev) => [...prev, cartItem]);
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
    // Color selection validation removed from here
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

  const proceedToPaymentMethodSelection = () => {
    setPage("paymentMethod");
  };

  const handleOrderSubmission = async () => {
    setIsSubmittingOrder(true);
    const orderTotal = cart.reduce((sum, p) => sum + (p.price * (p.quantity || 1)), 0); // Ensure quantity is considered
    if (cart.length === 0) {
        alert("Себет бос.");
        setIsSubmittingOrder(false);
        return;
    }

    const clientSideOrderId = `WEBAPP-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const orderTimestamp = new Date().toISOString();

    // Prepare product colors string for Google Sheet "өңі" column
    const productColorsString = cart.map(item => 
        `${item.name}: ${availableColors.find(c => c.value === item.selectedColor)?.name || item.selectedColor}`
    ).join('; ');

    const orderPayload = { 
        clientOrderId: clientSideOrderId,
        userContext: { 
            id: user?.id || "Контексттен алынбады", 
            username: user?.username || "Контексттен алынбады"
        },
        contactInfo: contactDetails, 
        deliveryAddress: address, 
        products: cart.map(p => ({ // Send only necessary product info to keep payload smaller
            id: p.id,
            name: p.name,
            price: p.price,
            quantity: p.quantity || 1,
            size: p.size,
            selectedColor: p.selectedColor,
            colorName: availableColors.find(c => c.value === p.selectedColor)?.name || p.selectedColor
        })),
        total: orderTotal,
        paymentMethod: selectedPaymentMethod,
        productColors: productColorsString, // String of all selected colors for the order
        orderTimestamp: orderTimestamp
    };

    console.log("Sending order to Google Apps Script Web App:", orderPayload);
    try {
      if (!APPS_SCRIPT_WEB_APP_URL || APPS_SCRIPT_WEB_APP_URL === 'СІЗДІҢ_GOOGLE_APPS_SCRIPT_WEB_APP_URL_МЕКЕНЖАЙЫҢЫЗ') { 
          throw new Error("Google Apps Script Web App URL конфигурацияланбаған!");
      }

      const res = await fetch(APPS_SCRIPT_WEB_APP_URL, {
        method: "POST",
        headers: {
           'Content-Type': 'text/plain;charset=utf-8', 
        },
        body: JSON.stringify(orderPayload), 
      });

      if (res.ok) {
        const result = await res.json(); 
        console.log("Successfully sent order to Apps Script, response:", result);
        if (result.status === "success") {
            alert(`✅ Тапсырыс №${clientSideOrderId} сәтті жіберілді! (Apps Script арқылы). Тапсырыс статусы туралы Telegram ботынан хабарлама күтіңіз.`);
        } else {
            alert(`⚠️ Тапсырысты жіберу кезінде Apps Script қатесі: ${result.message || 'Белгісіз қате'}`);
        }
        
        const n8nPayload = { ...orderPayload, appsScriptStatus: result.status, appsScriptMessage: result.message };
        try {
            const n8nRes = await fetch(N8N_ADMIN_NOTIFICATION_WEBHOOK_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(n8nPayload),
            });
            if (n8nRes.ok) console.log("Order data also sent to n8n webhook for admin notification.");
            else console.warn("Failed to send order data to n8n webhook after Apps Script success.");
        } catch (n8nErr) {
            console.error("Error sending order data to n8n webhook after Apps Script success:", n8nErr);
        }

        setCart([]); 
        setContactDetails({ fullName: "", phoneNumber: "", telegramUserID: "" }); 
        setAddress({ city: "", street: "", entrance: "", floor: "", flat: "" }); 
        // setSelectedProductColor(""); // This state is removed
        setProducts(prevProducts => prevProducts.map(p => ({ ...p, selectedColor: "" }))); // Reset selected colors on products
        setPage("catalog"); 
      } else {
        const errorText = await res.text(); 
        console.error("Error response from Apps Script Web App:", errorText);
        alert(`❌ Тапсырысты Apps Script-ке жіберу кезінде қате. Статус: ${res.status}. Жауап: ${errorText}`);
      }
    } catch (err) {
      console.error("Network or other error sending order to Apps Script Web App:", err);
      alert("⚠️ Тапсырысты Apps Script-ке жіберу кезінде желі қатесі: " + err.message);
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
    <div className="p-4 space-y-4 max-w-3xl mx-auto pb-24"> {/* Increased max-width for 3 columns */}
      {userWarning && page === "catalog" && ( 
         <div className="p-3 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 rounded-md text-sm mb-4 shadow">
            <p><span className="font-bold">Ескерту:</span> {userWarning}</p>
         </div>
      )}

      {page === "catalog" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"> 
          {products.map((product) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col" 
            >
              <Card className="shadow-xl rounded-2xl overflow-hidden h-full flex flex-col"> 
                <CardContent className="p-3 space-y-1.5 flex flex-col flex-grow"> {/* Adjusted padding and spacing */}
                  <img
                    src={product.imageURL}
                    alt={product.name}
                    className="w-full h-40 object-cover rounded-xl border" 
                    onError={(e) => {
                        e.currentTarget.src = 'https://placehold.co/400x300/E2E8F0/94A3B8?text=Сурет+жоқ';
                        e.currentTarget.alt = 'Сурет жүктелмеді';
                    }}
                  />
                  <div className="text-md font-bold text-gray-800 mt-1.5">{product.name}</div> {/* Adjusted text size */}
                  <p className="text-gray-600 text-xs min-h-[3em] flex-grow">{product.description}</p> 
                  
                  {/* Color Selection on Product Card */}
                  <div className="pt-1">
                    <label className="block text-xs font-medium text-gray-700 mb-0.5">Өңін таңдаңыз:</label>
                    <div className="flex flex-wrap gap-1.5">
                        {availableColors.map(color => (
                            <button
                                key={color.value}
                                type="button"
                                onClick={() => handleProductColorSelect(product.id, color.value)}
                                className={`w-6 h-6 rounded-full border-2 focus:outline-none focus:ring-1 focus:ring-offset-1
                                            ${product.selectedColor === color.value ? 'ring-indigo-500' : 'ring-gray-300'}
                                            ${color.value === 'white' ? 'border-gray-400' : ''}`}
                                style={{ backgroundColor: color.hex }}
                                title={color.name}
                            >
                               {product.selectedColor === color.value && <span className="text-xs" style={{color: color.value === 'black' || color.value === 'blue' || color.value === 'red' || color.value === 'green' || color.value === 'grey' ? 'white' : 'black'}}>✓</span>}
                            </button>
                        ))}
                    </div>
                    {product.selectedColor && <p className="text-xs text-gray-500 mt-0.5">Таңдалған: {availableColors.find(c => c.value === product.selectedColor)?.name}</p>}
                  </div>

                  {product.size && ( 
                    <p className="text-xs text-gray-500 mt-1">Өлшемі: {product.size}</p>
                  )}

                  <div className="text-lg font-semibold text-green-600 mt-1">{product.price} ₸</div> {/* Adjusted text size */}
                  
                  <motion.div
                    whileTap={{ scale: 0.98 }} 
                    animate={animateAdd === product.id ? { scale: [1, 1.05, 1] } : {}} 
                    transition={{ duration: 0.3 }}
                    className="mt-auto pt-2" 
                  >
                    <Button onClick={() => addToCart(product)} className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white py-2 text-sm"> 
                      Себетке қосу
                    </Button>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          ))}

          {products.length > 0 && ( 
            <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 w-[calc(100%-2rem)] max-w-md z-50 md:col-span-3 sm:col-span-2 col-span-1"> 
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
             <div className="text-center text-gray-500 py-10 md:col-span-3 sm:col-span-2 col-span-1">Өнімдер табылмады.</div>
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
                    <span className="font-medium">{item.name}</span>
                    {item.selectedColor && <span className="text-sm text-gray-600"> ({availableColors.find(c => c.value === item.selectedColor)?.name || item.selectedColor})</span>}
                     — <span className="font-semibold">{item.price} ₸</span>
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

      {page === "contactInfo" && ( // Color selection removed from this page
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
          <Button onClick={handleProceedToAddress} className="w-full bg-blue-700 hover:bg-blue-800 text-white rounded-xl py-3 text-lg mt-3">
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
              <span>{item.name} {item.selectedColor ? `(${availableColors.find(c => c.value === item.selectedColor)?.name || item.selectedColor})` : ''}</span>
              <span>{item.price} ₸</span>
            </div>
          ))}
          <hr className="my-2"/>
          <div className="font-bold text-right text-xl">Жалпы: {cart.reduce((sum, p) => sum + p.price, 0)} ₸</div>
          
          <Button onClick={proceedToPaymentMethodSelection} className="w-full bg-purple-700 hover:bg-purple-800 text-white rounded-xl py-3 text-lg mt-3">
            Төлем әдісін таңдау
          </Button>
        </motion.div>
      )}

      {page === "paymentMethod" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 bg-gray-50 p-6 rounded-xl shadow-lg">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-gray-800">Төлем әдісін таңдаңыз</h2>
                <Button variant="ghost" onClick={() => setPage("confirm")} className="text-blue-600 hover:bg-blue-50 text-sm">← Растауға оралу</Button>
            </div>
            
            <div className="space-y-3">
                <label htmlFor="payment-card" className="flex items-center p-3 border rounded-lg hover:bg-gray-100 cursor-pointer has-[:checked]:bg-blue-50 has-[:checked]:border-blue-500">
                    <input 
                        type="radio" 
                        id="payment-card" 
                        name="paymentMethod" 
                        value="card" 
                        checked={selectedPaymentMethod === "card"}
                        onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                        className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="ml-3 text-gray-700 font-medium">💳 Карта арқылы төлеу</span>
                </label>
                <label htmlFor="payment-kaspi" className="flex items-center p-3 border rounded-lg hover:bg-gray-100 cursor-pointer has-[:checked]:bg-red-50 has-[:checked]:border-red-500">
                    <input 
                        type="radio" 
                        id="payment-kaspi" 
                        name="paymentMethod" 
                        value="kaspi" 
                        checked={selectedPaymentMethod === "kaspi"}
                        onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                        className="h-4 w-4 text-red-600 border-gray-300 focus:ring-red-500"
                    />
                    <span className="ml-3 text-gray-700 font-medium"><img src="https://kaspi.kz/img/misc/logos/ главного-экрана.png" alt="Kaspi Logo" className="inline h-5 w-5 mr-1.5"/>Kaspi арқылы төлеу</span>
                </label>
            </div>

            {selectedPaymentMethod === "card" && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-700">
                    Картамен төлеу үшін менеджер сізбен хабарласып, төлем сілтемесін жібереді немесе басқа нұсқаулар береді.
                </div>
            )}
            {selectedPaymentMethod === "kaspi" && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
                    Kaspi арқылы төлеу үшін менеджер сізбен хабарласып, Kaspi Gold нөмірін немесе Kaspi QR кодын жібереді.
                </div>
            )}

            <p className="text-xl font-bold text-gray-800 text-center mt-4">Төлеуге: {cart.reduce((sum, p) => sum + p.price, 0)} ₸</p>
            
            <Button 
                onClick={handleOrderSubmission} 
                disabled={isSubmittingOrder || !selectedPaymentMethod}
                className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl py-3 text-lg mt-4"
            >
              {isSubmittingOrder ? "Жіберілуде..." : "✅ Тапсырысты растау және жіберу"}
            </Button>
             <p className="text-xs text-gray-500 mt-2 text-center">"Растау" батырмасын басқаннан кейін, тапсырысыңыз менеджерге жіберіледі. Таңдаған төлем әдісіңізге байланысты менеджер сізбен хабарласады.</p>
        </motion.div>
      )}
    </div>
  );
}
