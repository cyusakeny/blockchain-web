import { useState,useEffect } from "react";
import { ethers } from "ethers";
import { getContract } from "../lib/contract";
import contractABI from "../contractABI.json";

export default function Home() {
  const [hashes, setHashes] = useState([]);
  const [selectedHash, setSelectedHash] = useState(null);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [name, setName] = useState("");
  const [cost, setCost] = useState("");
  const [transferHash, setTransferHash] = useState("");
  const [newOwner, setNewOwner] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [events, setEvents] = useState([]);
  const [networkName, setNetworkName] = useState("Checking network...");

    // ✅ Detect and enforce correct network
  useEffect(() => {
    const checkNetwork = async () => {
      if (!window.ethereum) {
        setNetworkName("❌ MetaMask not found");
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();

      if (network.chainId === 11155111) {
        setNetworkName("🟢 Sepolia Testnet");
      } else {
        setNetworkName("🔴 Wrong Network (Switching...)");
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0xaa36a7" }], // Hex for 11155111
        });
        setNetworkName("🟢 Sepolia Testnet");
      }

      // React to live network changes
      window.ethereum.on("chainChanged", (chainId) => {
        const id = parseInt(chainId, 16);
        if (id === 11155111) {
          setNetworkName("🟢 Sepolia Testnet");
        } else if (id === 1) {
          setNetworkName("🔴 Ethereum Mainnet");
        } else {
          setNetworkName(`🔴 Unknown Network (${id})`);
        }
        window.location.reload(); // ensures provider updates
      });
    };

    checkNetwork();
  }, []);


  // ✅ Fetch all asset hashes
  const fetchMyAssetHashes = async () => {
    try {
      setLoading(true);
      setError("");
      setSelectedAsset(null);

      const contract = await getContract();
      const [owner] = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      console.log("Fetching asset hashes for:", owner);
      const ids = await contract.getAssetsOf(owner);

      if (!ids || ids.length === 0) {
        setHashes([]);
        setError("No assets found for this wallet.");
      } else {
        setHashes(ids);
      }
    } catch (err) {
      console.error("❌ Error fetching asset hashes:", err);
      setError("Error fetching asset hashes. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fetch one asset by hash
  const fetchAssetDetails = async (hash) => {
    try {
      setLoading(true);
      setError("");
      setSelectedHash(hash);

      const contract = await getContract();
      const data = await contract.getAsset(hash);

      const parsed = {
        name: data[0],
        idHash: data[1],
        cost: Number(data[2]),
        owner: data[3],
        registeredAt: new Date(Number(data[4]) * 1000).toLocaleString(),
        exists: data[5],
      };

      console.log("Fetched asset details:", parsed);
      setSelectedAsset(parsed);
    } catch (err) {
      console.error("❌ Error fetching asset details:", err);
      setError("Error fetching asset details. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Register a new asset
  const registerAsset = async () => {
    try {
      setLoading(true);
      const contract = await getContract();

      const tx = await contract.registerAsset(name, cost);
      console.log("Tx sent:", tx.hash);

      const receipt = await tx.wait();
      if (receipt.status === 1) {
        alert("✅ Asset registered successfully!");
        setName("");
        setCost("");
      } else {
        alert("❌ Transaction failed on-chain.");
      }
    } catch (err) {
      console.error("Register error:", err);
      if (err.code === 4001) alert("⚠️ Transaction rejected by user.");
      else if (err.reason) alert(`⚠️ Contract reverted: ${err.reason}`);
      else alert("❌ Unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Transfer asset ownership
  const transferAsset = async () => {
    try {
      setLoading(true);
      const contract = await getContract();

      const tx = await contract.transferAsset(transferHash, newOwner);
      const receipt = await tx.wait();

      if (receipt.status === 1) {
        alert("✅ Asset transferred successfully!");
        setTransferHash("");
        setNewOwner("");
      } else {
        alert("❌ Transfer failed.");
      }
    } catch (err) {
      console.error("Transfer error:", err);
      if (err.code === 4001) alert("⚠️ Transaction rejected by user.");
      else if (err.reason) alert(`⚠️ Contract reverted: ${err.reason}`);
      else alert("❌ Unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
  let contract;
  let listenersSet = false;

  const setupEventListeners = async () => {

    if (listenersSet) return; // ✅ Prevent duplicate listeners
    listenersSet = true;

    if (!window.ethereum) return;

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contractAddress = "0x39e9C1a2d8C5Ae92B98f4250a7679BDAFF4345dC"; // 👈 use your deployed address
    contract = new ethers.Contract(contractAddress, contractABI, signer);

    // 🟢 Listen for AssetRegistered
    contract.on("AssetRegistered", (idHash, owner, name, cost, event) => {
      console.log("📦 New asset registered:", { idHash, owner, name, cost });

      setEvents((prev) => [
        {
          type: "Registered",
          idHash,
          owner,
          name,
          cost: cost.toString(),
          timestamp: new Date().toLocaleString(),
        },
        ...prev,
      ]);
    });

    // 🟡 Listen for AssetTransferred
    contract.on("AssetTransferred", (idHash, prevOwner, newOwner, event) => {
      console.log("🔁 Asset transferred:", { idHash, prevOwner, newOwner });

      setEvents((prev) => [
        {
          type: "Transferred",
          idHash,
          prevOwner,
          newOwner,
          timestamp: new Date().toLocaleString(),
        },
        ...prev,
      ]);
    });
  };

  setupEventListeners();

  return () => {
    if (contract) {
      contract.removeAllListeners();
    }
  };
}, []);

  return (
    <div style={{ textAlign: "center", marginTop: 40, marginBottom: 100 }}>
 {/* --- Network indicator --- */}
      <div
        style={{
          background: "#f0f0f0",
          padding: "10px",
          borderRadius: "8px",
          width: "fit-content",
          margin: "auto",
          marginBottom: "20px",
        }}
      >
        <b>Network:</b> {networkName}
      </div>
      
      <h1>🧾 AutoHash Asset Registry</h1>

      {/* --- Register Asset --- */}
      <section
        style={{
          marginTop: 40,
          background: "#f8f8f8",
          padding: 20,
          borderRadius: 10,
          width: "70%",
          marginInline: "auto",
        }}
      >
        <h2>📥 Register New Asset</h2>
        <input
          placeholder="Asset Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ margin: "5px", padding: "8px", width: "60%" }}
        />
        <input
          placeholder="Cost"
          type="number"
          value={cost}
          onChange={(e) => setCost(e.target.value)}
          style={{ margin: "5px", padding: "8px", width: "60%" }}
        />
        <br />
        <button
          onClick={registerAsset}
          disabled={loading}
          style={{
            marginTop: "10px",
            padding: "8px 16px",
            borderRadius: "6px",
            border: "none",
            background: "#0070f3",
            color: "white",
            cursor: "pointer",
          }}
        >
          {loading ? "⏳ Registering..." : "Register Asset"}
        </button>
      </section>

      {/* --- Fetch All Hashes --- */}
      <section
        style={{
          marginTop: 40,
          background: "#f8f8f8",
          padding: 20,
          borderRadius: 10,
          width: "70%",
          marginInline: "auto",
        }}
      >
        <h2>📜 My Asset Hashes</h2>
        <button
          onClick={fetchMyAssetHashes}
          disabled={loading}
          style={{
            marginBottom: "10px",
            padding: "8px 16px",
            borderRadius: "6px",
            background: "#222",
            color: "white",
            border: "none",
            cursor: "pointer",
          }}
        >
          {loading ? "⏳ Loading..." : "Fetch My Asset Hashes"}
        </button>

        {error && <p style={{ color: "red", marginTop: 10 }}>{error}</p>}

        {!loading && hashes.length > 0 && (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {hashes.map((hash, i) => (
              <li
                key={i}
                style={{
                  background: "#eaeaea",
                  margin: "10px auto",
                  padding: "10px",
                  borderRadius: "8px",
                  width: "80%",
                  wordBreak: "break-all",
                }}
              >
                <p>{hash}</p>
                <button
                  onClick={() => fetchAssetDetails(hash)}
                  disabled={loading && selectedHash === hash}
                  style={{
                    padding: "5px 10px",
                    borderRadius: "5px",
                    border: "none",
                    background: "#0070f3",
                    color: "white",
                    cursor: "pointer",
                  }}
                >
                  {loading && selectedHash === hash
                    ? "⏳ Loading..."
                    : "🔍 View Details"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* --- View Selected Asset --- */}
      {selectedAsset && (
        <section
          style={{
            marginTop: 40,
            background: "#f7f7f7",
            padding: "20px",
            borderRadius: "10px",
            width: "70%",
            marginInline: "auto",
            textAlign: "left",
          }}
        >
          <h2>📄 Asset Details</h2>
          <p>
            <b>Name:</b> {selectedAsset.name}
          </p>
          <p>
            <b>Cost:</b> {selectedAsset.cost}
          </p>
          <p>
            <b>Owner:</b> {selectedAsset.owner}
          </p>
          <p>
            <b>Registered At:</b> {selectedAsset.registeredAt}
          </p>
          <p style={{ wordBreak: "break-all" }}>
            <b>Hash:</b> {selectedAsset.idHash}
          </p>
        </section>
      )}

      {/* --- Transfer Ownership --- */}
      <section
        style={{
          marginTop: 40,
          background: "#f8f8f8",
          padding: 20,
          borderRadius: 10,
          width: "70%",
          marginInline: "auto",
        }}
      >
        <h2>🔁 Transfer Asset Ownership</h2>
        <input
          placeholder="Asset Hash"
          value={transferHash}
          onChange={(e) => setTransferHash(e.target.value)}
          style={{ margin: "5px", padding: "8px", width: "60%" }}
        />
        <input
          placeholder="New Owner Address (0x...)"
          value={newOwner}
          onChange={(e) => setNewOwner(e.target.value)}
          style={{ margin: "5px", padding: "8px", width: "60%" }}
        />
        <br />
        <button
          onClick={transferAsset}
          disabled={loading}
          style={{
            marginTop: "10px",
            padding: "8px 16px",
            borderRadius: "6px",
            border: "none",
            background: "#28a745",
            color: "white",
            cursor: "pointer",
          }}
        >
          {loading ? "⏳ Transferring..." : "Transfer Ownership"}
        </button>
      </section>
      {/* --- Event Logs --- */}
      {/* --- Live Event Feed --- */}
<section
  style={{
    marginTop: 40,
    background: "#f0f0f0",
    padding: 20,
    borderRadius: 10,
    width: "70%",
    marginInline: "auto",
    textAlign: "left",
  }}
>
  <h2>📊 Live Event Feed</h2>
  {events.length === 0 && <p>No events yet. Interact with the contract!</p>}
  <ul style={{ listStyle: "none", padding: 0 }}>
    {events.map((e, i) => (
      <li
        key={i}
        style={{
          background: e.type === "Registered" ? "#d4edda" : "#fff3cd",
          borderLeft:
            e.type === "Registered"
              ? "4px solid #28a745"
              : "4px solid #ffc107",
          margin: "10px 0",
          padding: "10px",
          borderRadius: "8px",
        }}
      >
        <p>
          <b>{e.type}</b> — {e.timestamp}
        </p>
        <p>
          <b>Hash:</b> {e.idHash}
        </p>
        {e.type === "Registered" && (
          <>
            <p>
              <b>Owner:</b> {e.owner}
            </p>
            <p>
              <b>Name:</b> {e.name} — <b>Cost:</b> {e.cost}
            </p>
          </>
        )}
        {e.type === "Transferred" && (
          <>
            <p>
              <b>From:</b> {e.prevOwner}
            </p>
            <p>
              <b>To:</b> {e.newOwner}
            </p>
          </>
        )}
      </li>
    ))}
  </ul>
</section>

    </div>
  );
}
