import { useState, useEffect, useRef, useCallback } from "react";

const API_ENDPOINT = "https://cors-proxy.dominic-fd8.workers.dev";

export default function RATracker() {
    const [data, setData] = useState(null);
    const [imageSrc, setImageSrc] = useState("");
    const [newImageFlag, setNewImageFlag] = useState(false);
    const [firstBoot, setFirstBoot] = useState(true);
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markerRef = useRef(null);
    const leafletLoadedRef = useRef(false);
    const [mapReady, setMapReady] = useState(false);

    // Load Leaflet CSS + JS once
    useEffect(() => {
        if (leafletLoadedRef.current) return;
        leafletLoadedRef.current = true;

        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet/dist/leaflet.css";
        document.head.appendChild(link);

        const script = document.createElement("script");
        script.src = "https://unpkg.com/leaflet/dist/leaflet.js";
        script.onload = () => setMapReady(true);
        document.head.appendChild(script);
    }, []);

    // Init map once Leaflet is loaded and container exists
    useEffect(() => {
        if (!mapReady || !mapRef.current || mapInstanceRef.current) return;
        const L = window.L;
        const map = L.map(mapRef.current).setView([37.7749, -122.4194], 13);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);
        const marker = L.marker([37.7749, -122.4194]).addTo(map);
        mapInstanceRef.current = map;
        markerRef.current = marker;
    }, [mapReady]);

    const updateMap = useCallback((coordinates, zoom) => {
        if (mapInstanceRef.current && markerRef.current) {
            mapInstanceRef.current.setView(coordinates, zoom);
            markerRef.current.setLatLng(coordinates);
        }
    }, []);

    const sendTrueBool = useCallback(() => {
        fetch(`${API_ENDPOINT}/image-got`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageReceived: true }),
        }).catch(() => {});
    }, []);

    const checkNewImage = useCallback(() => {
        fetch(`${API_ENDPOINT}/new-image`)
            .then(r => r.json())
            .then(d => setNewImageFlag(d.newImageAvailable))
            .catch(() => {});
    }, []);

    // Use a ref for newImageFlag and firstBoot so fetchData stays stable
    const newImageFlagRef = useRef(false);
    const firstBootRef = useRef(true);
    useEffect(() => { newImageFlagRef.current = newImageFlag; }, [newImageFlag]);
    useEffect(() => { firstBootRef.current = firstBoot; }, [firstBoot]);

    const fetchData = useCallback(() => {
        fetch(`${API_ENDPOINT}/get`)
            .then(r => r.json())
            .then(d => {
                setData(d);
                updateMap(d.coordinates, d.zoomLevel);
                if (newImageFlagRef.current || firstBootRef.current) {
                    setImageSrc(`${API_ENDPOINT}${d.imageUrl}`);
                    sendTrueBool();
                    setFirstBoot(false);
                    setNewImageFlag(false);
                }
            })
            .catch(err => console.error("Error fetching data:", err));
    }, [updateMap, sendTrueBool]);

    useEffect(() => {
        fetchData();
        checkNewImage();
        const dataInterval = setInterval(fetchData, 10000);
        const imageInterval = setInterval(checkNewImage, 10000);
        const reloadInterval = setInterval(() => location.reload(), 300000);
        return () => {
            clearInterval(dataInterval);
            clearInterval(imageInterval);
            clearInterval(reloadInterval);
        };
    }, [fetchData, checkNewImage]);

    return (
        <>
            <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body, #root { height: 100%; }

        @media (max-width: 600px) {
          .header-title { font-size: 40px !important; }
          .content-area { flex-direction: column !important; padding: 10px !important; }
          .map-container { margin-right: 0 !important; margin-bottom: 20px !important; }
          .image-box { width: 100% !important; height: auto !important; }
          .image-box img { width: 100% !important; height: auto !important; }
          .footer { font-size: 20px !important; padding: 10px !important; }
          .dynamic-label { font-size: 24px !important; }
        }
      `}</style>

            <div style={{ display: "flex", flexDirection: "column", height: "100vh", fontFamily: "Arial, sans-serif" }}>

                {/* ── Header ── */}
                <div style={{
                    backgroundColor: "#000",
                    padding: "10px",
                    display: "flex",
                    alignItems: "center",
                    flexShrink: 0,
                }}>
                    <a href="../home.html">
                        <img
                            src="../full-color.png"
                            alt="Logo"
                            style={{ width: 100, height: 120, padding: 10, marginRight: 60 }}
                        />
                    </a>
                    <div className="header-title" style={{
                        flex: 1,
                        textAlign: "center",
                        color: "aliceblue",
                        fontSize: 80,
                    }}>
                        Where is Your RA?
                    </div>
                </div>

                {/* ── Main content ── */}
                <div className="content-area" style={{
                    display: "flex",
                    flex: 1,
                    padding: 25,
                    overflow: "hidden",
                }}>

                    {/* Left — Map */}
                    <div className="map-container" style={{
                        flex: 1,
                        border: "2px solid #000",
                        padding: 10,
                        marginRight: 10,
                    }}>
                        <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
                    </div>

                    {/* Right — Labels + Image */}
                    <div style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                    }}>
                        <div style={{ textAlign: "center", marginBottom: 20 }}>
                            <div className="dynamic-label" style={{ fontSize: 40, marginBottom: 10 }}>
                                {data ? data.label1Text : "Loading..."}
                            </div>
                            <div className="dynamic-label" style={{ fontSize: 40, marginBottom: 10 }}>
                                {data ? data.label2Text : ""}
                            </div>
                        </div>

                        <div className="image-box" style={{
                            width: 640,
                            height: 480,
                            border: "2px solid #000",
                            overflow: "hidden",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                        }}>
                            <a href={imageSrc || "#"} target="_blank" rel="noreferrer">
                                <img
                                    src={imageSrc}
                                    alt="DOM"
                                    style={{
                                        width: 720,
                                        height: 480,
                                        objectFit: "contain",
                                        display: "block",
                                        background: "#eee",
                                    }}
                                />
                            </a>
                        </div>
                    </div>
                </div>

                {/* ── Footer ── */}
                <div className="footer" style={{
                    backgroundColor: "#000",
                    color: "#fff",
                    textAlign: "center",
                    padding: 15,
                    flexShrink: 0,
                    fontSize: 30,
                }}>
                    Call or Text at (586)-651-0994 or knock if not busy.
                </div>

            </div>
        </>
    );
}