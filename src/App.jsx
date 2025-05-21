import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import Loading from "./components/Loading";

export default function WebAppShop() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [page, setPage] = useState("catalog");
  const [address, setAddress] = useState({ city: "", street: "", entrance: "", floor: "", flat: "" });
  const [animateAdd, setAnimateAdd] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState({ id: "", username: "" });

  // ✅ Өнімдерді жүктеу
  const fetchProducts = async () => {
    try {
      const response = await fetch("https://opensheet.elk.sh/1O03ib-iT4vTpJEP5DUOawv96NvQPiirhQSudNEBAtQk/Sheet1");
      const data = await response.json();

      const formatted = data.map(item => {
        const isDriveLink = item.imageURL.includes("drive.google.com");
        const imageURL = isDriveLink
          ? `https://drive.google.com/uc?export=view&id=${item.imageURL.split("/d/")[1].split("/")[0]}`
          : item.imageURL;

        return {
          id: item.id,
          name: item.name,
          imageURL,
          price: parseInt(item.price),
          description: item.description,
          stock: item.stock,
          size: item.size
        };
      });

      setProducts(formatted);
    } catch (err) {
      setError("Өнімдер жүктелмеді");
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Telegram WebApp арқылы келген user дерегін алу
  useEffect(() => {
    fetchProducts();

    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();

      const initDataUnsafe = window.Telegram.WebApp.initDataUnsafe;
      console.log("Telegram initDataUnsafe:", initDataUnsafe);

      if (initDataUnsafe?.user) {
        setUser({
          id: initDataUnsafe.user.id.toString(),
          username: initDataUnsafe.user.username || "(Анықталмаған)"
        });
      } else {
        alert("❌ Telegram пайдаланушы мәліметтері жоқ");
      }
    } else {
      alert("❌ Telegram WebApp арқылы ашу қажет!");
    }
  }, []);

  const addToCart = (product) => {
    setCart((prev) => [...prev, product]);
    setAnimateAdd(product.id);
    setTimeout(() => setAnimateAdd(null), 500);
  };

  const handleConfirmAddress = () => {
    console.log("Confirmed address:", address);
    setPage("confirm");
  };

  // ✅ Telegram-ға тапсырыс жіберу
  const handlePayment = async () => {
  const order = {
    user: {
      id: user?.id || "аноним",
      username: user?.username || "аноним"
    },
    address,
    products: cart,
    total: cart.reduce((sum, p) => sum + p.price, 0),
  };

  try {
    const res = await fetch("https://alphabotai.app.n8n.cloud/webhook-test/49eb5226-ed25-40e6-a3fc-272616c5a1a0", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order),
    });

    if (res.ok) {
      alert("✅ Тапсырыс жіберілді!");
    } else {
      alert("❌ Сервер жауап қатпады.");
    }
  } catch (err) {
    alert("⚠️ Қате: " + err.message);
  }
};



  return (
    <div className="p-4 space-y-4 max-w-md mx-auto">
      {/* Каталог беті */}
      {page === "catalog" && (
        <div className="grid gap-4">
          {loading && <Loading />}
          {error && <div className="text-red-600">{error}</div>}

          {!loading && !error && products.map((product) => (
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
                    className="w-full h-36 object-cover rounded-xl border"
                  />
                  <div className="text-xl font-bold text-gray-800">{product.name}</div>
                  <div className="text-gray-600 text-sm">{product.description}</div>
                  <div className="text-lg font-semibold text-green-600">{product.price} ₸</div>
                  <motion.div
                    whileTap={{ scale: 0.95 }}
                    animate={animateAdd === product.id ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ duration: 0.4 }}
                  >
                    <Button onClick={() => addToCart(product)} className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white">
                      Себетке қосу
                    </Button>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          ))}

          {!loading && !error && (
            <div className="relative w-full">
              <Button onClick={() => setPage("cart")} className="w-full bg-black text-white rounded-xl py-3 text-lg relative">
                Себетке өту
                {cart.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                    {cart.length}
                  </span>
                )}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Себет беті */}
      {page === "cart" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="text-xl font-semibold">Себет</div>
          {cart.map((item, idx) => (
            <div key={idx} className="border p-2 rounded-xl bg-white shadow">
              {item.name} — {item.price} ₸
            </div>
          ))}
          <div className="font-bold text-right">Жалпы: {cart.reduce((sum, p) => sum + p.price, 0)} ₸</div>
          <Button onClick={() => setPage("address")} className="w-full bg-green-600 text-white rounded-xl py-3">📍 Адрес енгізу</Button>
        </motion.div>
      )}

      {/* Адрес беті */}
      {page === "address" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="text-lg">Толық адрес мәліметтеріңізді енгізіңіз:</div>
          <input type="text" placeholder="Қала" className="w-full p-2 border rounded-xl" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} />
          <input type="text" placeholder="Көше, үй нөмірі" className="w-full p-2 border rounded-xl" value={address.street} onChange={(e) => setAddress({ ...address, street: e.target.value })} />
          <input type="text" placeholder="Кіреберіс" className="w-full p-2 border rounded-xl" value={address.entrance} onChange={(e) => setAddress({ ...address, entrance: e.target.value })} />
          <input type="text" placeholder="Қабат" className="w-full p-2 border rounded-xl" value={address.floor} onChange={(e) => setAddress({ ...address, floor: e.target.value })} />
          <input type="text" placeholder="Пәтер" className="w-full p-2 border rounded-xl" value={address.flat} onChange={(e) => setAddress({ ...address, flat: e.target.value })} />
          <Button onClick={handleConfirmAddress} className="w-full bg-blue-700 text-white rounded-xl py-3">Растау</Button>
        </motion.div>
      )}

      {/* Тапсырыс растау беті */}
      {page === "confirm" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
          <div className="text-xl font-semibold">Тапсырыс мәліметтері</div>
          {cart.map((item, idx) => (
            <div key={idx}>{item.name} — {item.price} ₸</div>
          ))}
          <div>
            Қала: {address.city}, Адрес: {address.street}, Кіреберіс: {address.entrance}, Қабат: {address.floor}, Пәтер: {address.flat}
          </div>
          <div className="text-sm text-gray-500">Пайдаланушы: @{user.username} (ID: {user.id})</div>
          <div className="font-bold text-right">Жалпы: {cart.reduce((sum, p) => sum + p.price, 0)} ₸</div>
          <Button onClick={handlePayment} className="w-full bg-purple-700 text-white rounded-xl py-3">
            Төлемге өту
          </Button>
        </motion.div>
      )}
    </div>
  );
}
