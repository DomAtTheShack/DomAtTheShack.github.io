import React, { useEffect, useRef, useCallback } from "react";
import { useRATracker } from "./useRATracker";

export default function RATracker() {
    const { data, imageSrc, fetchData, checkNewImage } = useRATracker();

    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markerRef = useRef(null);
    const leafletLoadedRef = useRef(false);
    const mapReadyRef = useRef(false);

    const initMap = useCallback(() => {
        if (!mapReadyRef.current || !mapRef.current || mapInstanceRef.current) return;
        const L = window.L;
        const map = L.map(mapRef.current).setView([37.7749, -122.4194], 13);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);
        markerRef.current = L.marker([37.7749, -122.4194]).addTo(map);
        mapInstanceRef.current = map;
    }, []);

    const updateMap = useCallback((coordinates, zoom) => {
        if (!mapInstanceRef.current || !markerRef.current) return;
        mapInstanceRef.current.setView(coordinates, zoom);
        markerRef.current.setLatLng(coordinates);
    }, []);

    useEffect(() => {
        if (leafletLoadedRef.current) return;
        leafletLoadedRef.current = true;

        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet/dist/leaflet.css";
        document.head.appendChild(link);

        const script = document.createElement("script");
        script.src = "https://unpkg.com/leaflet/dist/leaflet.js";
        script.onload = () => {
            mapReadyRef.current = true;
            initMap();
        };
        document.head.appendChild(script);
    }, [initMap]);

    // Set favicon
    useEffect(() => {
        const favicon = document.querySelector("link[rel~='icon']") || document.createElement("link");
        favicon.rel = "icon";
        favicon.href = "/full-color.png";
        document.head.appendChild(favicon);
    }, []);

    useEffect(() => {
        fetchData(updateMap);
        checkNewImage();
        const dataInterval   = setInterval(() => fetchData(updateMap), 10000);
        const imageInterval  = setInterval(checkNewImage, 10000);
        const reloadInterval = setInterval(() => location.reload(), 300000);
        return () => {
            clearInterval(dataInterval);
            clearInterval(imageInterval);
            clearInterval(reloadInterval);
        };
    }, [fetchData, checkNewImage, updateMap]);

    return (
        <>
            <style>{`
                * { box-sizing: border-box; margin: 0; padding: 0; }
                html, body, #root { height: 100%; }

                @media (max-width: 600px) {
                    .header-title  { font-size: 40px !important; }
                    .content-area  { flex-direction: column !important; padding: 10px !important; }
                    .dynamic-label { font-size: 32px !important; }
                    .footer        { font-size: 20px !important; padding: 10px !important; }
                }
            `}</style>

            <div style={{ display: "flex", flexDirection: "column", height: "100vh", fontFamily: "Arial, sans-serif" }}>

                {/* Header */}
                <div style={{ backgroundColor: "#000", padding: "10px", display: "flex", alignItems: "center", flexShrink: 0 }}>
                    <a href="../home.html">
                        <img src="/full-color.png" alt="Logo" style={{ width: 100, height: 120, padding: 10, marginRight: 60 }} />
                    </a>
                    <div className="header-title" style={{ flex: 1, textAlign: "center", color: "aliceblue", fontSize: 70 }}>
                        Where is Your RA?
                    </div>
                </div>

                {/* Main content — all boxes share the same top/bottom edges */}
                <div className="content-area" style={{
                    display: "flex",
                    flex: 1,
                    padding: 25,
                    gap: 20,
                    overflow: "hidden",
                    alignItems: "stretch",   /* all columns stretch to the same height */
                }}>

                    {/* Left — Map, fills full column height */}
                    <div style={{
                        flex: 1,
                        border: "2px solid #000",
                        padding: 10,
                        display: "flex",
                        flexDirection: "column",
                    }}>
                        <div ref={mapRef} style={{ flex: 1, width: "100%" }} />
                    </div>

                    {/* Right — label box + image box stacked, same total height as map */}
                    <div style={{
                        flex: 2,
                        display: "flex",
                        flexDirection: "column",
                        gap: 20,
                    }}>

                        {/* Status labels */}
                        <div style={{
                            border: "2px solid #000",
                            background: "#f9f9f9",
                            padding: "20px 10px",
                            textAlign: "center",
                            flexShrink: 0,
                        }}>
                            <div className="dynamic-label" style={{
                                fontSize: 64,
                                fontWeight: "bold",
                                lineHeight: 1.2,
                                marginBottom: 10,
                                color: "#000",
                            }}>
                                {data ? data.label1Text : "Loading..."}
                            </div>
                            <div className="dynamic-label" style={{
                                fontSize: 52,
                                fontWeight: "600",
                                lineHeight: 1.2,
                                color: "#222",
                            }}>
                                {data ? data.label2Text : ""}
                            </div>
                        </div>

                        {/* Image — grows to fill remaining height, aligned with bottom of map */}
                        <div style={{
                            flex: 1,
                            border: "2px solid #000",
                            overflow: "hidden",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                        }}>
                            <a href={imageSrc || "#"} target="_blank" rel="noreferrer" style={{ display: "flex", width: "100%", height: "100%" }}>
                                <img
                                    src={imageSrc}
                                    alt="DOM"
                                    style={{ width: "100%", height: "100%", objectFit: "contain", display: "block", background: "#eee" }}
                                />
                            </a>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="footer" style={{ backgroundColor: "#000", color: "#fff", textAlign: "center", padding: 15, flexShrink: 0, fontSize: 30 }}>
                    Call or Text at (734)-430-0220 or knock if not busy.
                </div>

            </div>
        </>
    );
}