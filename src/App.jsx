import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import Loading from "./components/Loading";

export default function WebAppShop() {
  const [products, setProducts] = useState<any[]>([]); // Өнімдердің типін нақтылау жақсы (мысалы, interface Product {...})
  const [cart, setCart] = useState<any[]>([]); // Сол сияқты, cart элементтерінің типі
  const [page, setPage] = useState<"catalog" | "cart" | "address" | "confirm">("catalog");
  const [address, setAddress] = useState({ city: "", street: "", entrance: "", floor: "", flat: "" });
  const [user, setUser] = useState<{ id: string, username: string } | null>(null);

  const [productsLoading, setProductsLoading] = useState(true); // Өнімдер үшін бөлек loading
  const [telegramReady, setTelegramReady] = useState(false); // Telegram контекстінің дайындығы үшін
  const [initialLoading, setInitialLoading] = useState(true); // Жалпы бастапқы жүктеу

  const [error, setError] = useState<string | null>(null);

  // 1️⃣ Өнімдерді Google Sheet-тен жүктейміз
  useEffect(() => {
    async function fetchProducts() {
      setProductsLoading(true); // Жүктеуді бастау
      setError(null); // Алдыңғы қатені тазалау
      try {
        const res = await fetch("https://opensheet.elk.sh/1O03ib-iT4vTpJEP5DUOawv96NvQPiirhQSudNEBAtQk/Sheet1");
        if (!res.ok) { // HTTP қатесін тексеру
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        setProducts(data.map((item: any) => {
          const isDrive = item.imageURL && item.imageURL.includes("drive.google.com");
          return {
            ...item,
            id: item.id || crypto.randomUUID(), // Егер id болмаса, генерациялау
            price: +item.price || 0, // Егер бағасы жарамсыз болса, 0
            imageURL: isDrive
              ? `https://drive.google.com/uc?export=view&id=${item.imageURL.split("/d/")[1].split("/")[0]}`
              : item.imageURL
          };
        }));
      } catch (e: any) {
        console.error("Failed to fetch products:", e);
        setError(`Өнімдер жүктелмеді: ${e.message}`);
      } finally {
        setProductsLoading(false);
      }
    }
    fetchProducts();
  }, []);

  // 2️⃣ Telegram WebApp контекстін тексереміз
  useEffect(() => {
    if (window.Telegram?.WebApp) {
      try {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
        const init = window.Telegram.WebApp.initDataUnsafe;
        if (init?.user) {
          setUser({
            id: init.user.id.toString(),
            username: init.user.username || "(unknown)"
          });
          setTelegramReady(true); // Telegram дайын
        } else {
          // Пайдаланушы дерегі жоқ, бірақ WebApp контексі бар.
          // Бұл жағдайды қалай өңдеу керектігін шешу керек.
          // Мүмкін бұл да қате немесе WebApp сыртында ашылғанға ұқсас.
          console.warn("Telegram WebApp context is present, but no user data.");
          setTelegramReady(false); // Немесе true, бірақ user жоқ екенін ескеру
        }
      } catch (e) {
        console.error("Error initializing Telegram WebApp:", e);
        // Бұл жерде қате туындаса, isTelegram === false сценарийіне өтуі мүмкін.
        setTelegramReady(false);
      }
    } else {
      setTelegramReady(false); // Telegram контексті жоқ
    }
  }, []);

  // Жалпы бастапқы жүктеу күйін анықтау
  useEffect(() => {
    // `telegramReady` күйінің бастапқы мәні `false` болғандықтан,
    // `window.Telegram?.WebApp` тексеруінен кейін ол не `true`, не `false` болады.
    // `productsLoading` аяқталғанша және `telegramReady` мәні орнатылғанша күтеміз.
    // `telegramReady` бірден орнатылуы мүмкін, өйткені `window.Telegram.WebApp.ready()` синхронды емес.
    // Алайда, біздің мақсатымыз - `productsLoading` аяқталғанша және `telegramReady` анықталғанша күту.
    // `telegramReady` әрқашан бір мәнге (`true` немесе `false`) ие болады, сондықтан оны тікелей қолданамыз.
    if (!productsLoading) { // Өнімдер жүктеліп біткенде
         setInitialLoading(false);
    }
  }, [productsLoading]);


  // 3️⃣ Жүктеу немесе Telegram контексті жоқ болса көрсетілетін экрандар
  if (initialLoading) {
    return <Loading />;
  }

  if (!user && window.Telegram?.WebApp && telegramReady) {
    // Telegram WebApp ішінде, бірақ user дерегі жоқ (жоғарыдағы console.warn жағдайы)
    // Мұны қалай өңдеу керектігін шешіңіз. Мүмкін, бұл да "контекст жоқ" жағдайы.
     return (
       <div className="p-4 max-w-md mx-auto text-center">
         <h2 className="text-xl font-semibold mb-4">❗️ Пайдаланушы дерегі табылмады</h2>
         <p className="mb-6">
           Telegram Web App ішіндесіз, бірақ пайдаланушы ақпараты алынбады.
           Ботты қайта іске қосып көріңіз.
         </p>
         <Button
           as="a"
            // Боттың нақты username-ін көрсетіңіз
           href={`https://t.me/${process.env.REACT_APP_BOT_USERNAME || "YourBotUsername"}?start=shop`}
           className="bg-blue-600 text-white"
         >
           Ботты ашу
         </Button>
       </div>
     );
  }


  if (!user && !window.Telegram?.WebApp) { // Немесе !telegramReady && !user
    return (
      <div className="p-4 max-w-md mx-auto text-center">
        <h2 className="text-xl font-semibold mb-4">❗️ Web App контексті жоқ</h2>
        <p className="mb-6">
          Өтінеміз, **Telegram** ішіндегі боттан
          «🛍️ Онлайн дүкен» батырмасын басып ашыңыз.
        </p>
        <Button
          as="a"
           // Боттың нақты username-ін көрсетіңіз
          href={`https://t.me/${process.env.REACT_APP_BOT_USERNAME || "YourBotUsername"}?start=shop`}
          className="bg-blue-600 text-white"
        >
          Ботты ашу
        </Button>
      </div>
    );
  }

  // Қате болса (жүктеу аяқталғаннан кейін)
  if (error && page === "catalog") { // Немесе error-ды глобалды түрде жоғарыда көрсету
    return (
      <div className="p-4 max-w-md mx-auto text-center">
        <div className="text-red-600 text-xl p-4 border border-red-600 rounded-md">
            <p className="font-semibold">Қате пайда болды:</p>
            {error}
            <Button onClick={() => window.location.reload()} className="mt-4">
                Қайта жүктеу
            </Button>
        </div>
      </div>
    );
  }


  // 4️⃣ Қалған логика — каталог, себет, адрес, растау
  const addToCart = (p: any) => setCart(prev => [...prev, p]);
  const total = cart.reduce((s, p) => s + (p.price || 0), 0); // p.price болуын тексеру

  const handlePayment = async () => {
    if (!user) {
        alert("Пайдаланушы анықталмады!");
        return;
    }
    if (cart.length === 0) {
        alert("Себет бос!");
        return;
    }
    const order = { user, address, products: cart, total };
    // Төлем алдында loading күйін орнатуға болады
    try {
      const res = await fetch("https://alphabotai.app.n8n.cloud/webhook-test/49eb5226-ed25-40e6-a3fc-272616c5a1a0", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(order)
      });
      alert(res.ok ? "✅ Тапсырыс жіберілді!" : `❌ Қате серверде: ${res.statusText}`);
      if (res.ok) {
        setCart([]); // Себетті тазалау
        setPage("catalog");
      }
    } catch (e: any) {
      alert("⚠️ Байланыс қатесі: " + e.message);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto space-y-4 pb-20"> {/* Төменгі жағында орын қалдыру */}
      {page === "catalog" && (
        <>
          {products.length === 0 && !productsLoading && !error && (
            <div className="text-center text-gray-500 py-8">Өнімдер табылмады.</div>
          )}
          <div className="grid gap-4">
            {products.map((p: any) => (
              <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="rounded-2xl overflow-hidden shadow">
                  <CardContent className="space-y-2 p-4">
                    {p.imageURL ? (
                        <img src={p.imageURL} alt={p.name} className="w-full h-40 object-cover rounded" onError={(e) => (e.currentTarget.style.display = 'none')} />
                    ) : (
                        <div className="w-full h-40 bg-gray-200 rounded flex items-center justify-center text-gray-400">Сурет жоқ</div>
                    )}
                    <h3 className="font-bold text-lg">{p.name || "Атауы жоқ"}</h3>
                    <p className="text-gray-600 text-sm min-h-[40px]">{p.description || "Сипаттамасы жоқ"}</p>
                    <p className="text-green-600 font-semibold text-lg">{p.price} ₸</p>
                    <Button onClick={() => { addToCart(p) }} className="w-full">Себетке қосу</Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
          {products.length > 0 && (
            <Button onClick={() => setPage("cart")} className="w-full bg-black text-white fixed bottom-4 left-1/2 transform -translate-x-1/2 max-w-[calc(100%-2rem)] md:max-w-md z-50">
              Себет ({cart.length}) - {total} ₸
            </Button>
          )}
        </>
      )}

      {page === "cart" && (
        <>
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-2xl">Себет</h2>
            <Button variant="ghost" onClick={() => setPage("catalog")}>← Каталогқа оралу</Button>
          </div>
          {cart.length === 0 ? (
            <p>Себетіңіз бос.</p>
          ) : (
            cart.map((p, i) => (
              <div key={i} className="border p-3 rounded-md mb-2 flex justify-between items-center">
                <span>{p.name} — {p.price} ₸</span>
                {/* Мүмкін, өшіру батырмасы керек */}
              </div>
            ))
          )}
          {cart.length > 0 && (
            <>
                <p className="text-right font-bold text-xl mt-4">Жалпы: {total} ₸</p>
                <Button onClick={() => setPage("address")} className="w-full mt-4">📍 Адрес енгізу</Button>
            </>
          )}
        </>
      )}

      {page === "address" && (
        <>
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-2xl">Адрес енгізу</h2>
            <Button variant="ghost" onClick={() => setPage("cart")}>← Себетке оралу</Button>
          </div>
          {["city", "street", "entrance", "floor", "flat"].map(key => (
            <input
              key={key}
              className="w-full p-3 border rounded-md bg-white text-black mb-3"
              placeholder={(key === "city" ? "Қала (міндетті)" :
                            key === "street" ? "Көше, үй (міндетті)" :
                            key === "entrance" ? "Кіреберіс (подъезд)" :
                            key === "floor" ? "Қабат (этаж)" :
                            "Пәтер (квартира)")} // Placeholder-лерді жақсарту
              value={(address as any)[key]}
              onChange={e => setAddress({ ...address, [key]: e.target.value })}
            />
          ))}
          <Button
            onClick={() => {
                if (!address.city || !address.street) {
                    alert("Қала және көше мен үйді енгізу міндетті.");
                    return;
                }
                setPage("confirm");
            }}
            className="w-full mt-2"
          >
            Растауға өту
          </Button>
        </>
      )}

      {page === "confirm" && user && ( // user бар екенін тексеру
        <>
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-2xl">Тапсырысты растау</h2>
            <Button variant="ghost" onClick={() => setPage("address")}>← Адресті өзгерту</Button>
          </div>
          <Card className="p-4 space-y-2">
            <p><span className="font-semibold">Пайдаланушы:</span> @{user.username} (ID: {user.id})</p>
            <p><span className="font-semibold">Жеткізу адресі:</span> {address.city}, {address.street}, кіреберіс {address.entrance || "-"}, қабат {address.floor || "-"}, пәтер {address.flat || "-"}</p>
            <p className="font-semibold mt-2">Тауарлар:</p>
            <ul className="list-disc list-inside pl-4">
              {cart.map((p, i) => <li key={i}>{p.name} — {p.price} ₸</li>)}
            </ul>
            <p className="text-right font-bold text-xl mt-3">Жалпы сома: {total} ₸</p>
          </Card>
          <Button onClick={handlePayment} className="w-full bg-purple-700 text-white mt-4">
            Төлеу және тапсырыс беру
          </Button>
        </>
      )}
    </div>
  );
}
