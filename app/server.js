import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import FormInput from "./components/FormInput";
import TableBelanja from "./components/TableBelanja";
import "./css/Kasir.css";

// Base URL API & Socket
const API_URL = "https://blueswift.onpella.app/api/belanja";
const SOCKET_URL = "https://blueswift.onpella.app";

function Kasir() {
  const [items, setItems] = useState([]);
  const [namaBarang, setNamaBarang] = useState("");
  const [harga, setHarga] = useState("");

  // Koneksi Socket
  useEffect(() => {
    const socket = io(SOCKET_URL);

    socket.on("connect", () => {
      console.log("Terhubung ke socket server ✅");
    });

    socket.on("updateData", (data) => {
      setItems(data);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Ambil data dari API
  useEffect(() => {
    fetch(API_URL)
      .then((res) => res.json())
      .then((data) => setItems(data))
      .catch((err) => console.error("Gagal ambil data:", err));
  }, []);

  const handleAddItem = async (e) => {
    e.preventDefault();

    const newItem = { namaBarang, harga };

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newItem),
      });

      const data = await res.json();
      console.log("Barang ditambahkan:", data);

      setNamaBarang("");
      setHarga("");
    } catch (err) {
      console.error("Gagal tambah barang:", err);
    }
  };

  return (
    <div className="kasir">
      <h1 className="text-2xl font-bold mb-4">Kasir Belanja</h1>

      <FormInput
        namaBarang={namaBarang}
        setNamaBarang={setNamaBarang}
        harga={harga}
        setHarga={setHarga}
        handleAddItem={handleAddItem}
      />

      <TableBelanja items={items} />
    </div>
  );
}

export default Kasir;
