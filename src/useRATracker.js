import { useState, useEffect, useRef, useCallback } from "react";

const API_ENDPOINT = "https://cors-proxy.dominic-fd8.workers.dev";

export function useRATracker() {
    const [data, setData] = useState(null);
    const [imageSrc, setImageSrc] = useState("");

    const newImageFlagRef = useRef(false);
    const firstBootRef = useRef(true);

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
            .then(d => { newImageFlagRef.current = d.newImageAvailable; })
            .catch(() => {});
    }, []);

    const fetchData = useCallback((updateMap) => {
        fetch(`${API_ENDPOINT}/get`)
            .then(r => r.json())
            .then(d => {
                setData(d);
                if (updateMap) updateMap(d.coordinates, d.zoomLevel);
                if (newImageFlagRef.current || firstBootRef.current) {
                    setImageSrc(`${API_ENDPOINT}${d.imageUrl}`);
                    sendTrueBool();
                    firstBootRef.current = false;
                    newImageFlagRef.current = false;
                }
            })
            .catch(err => console.error("Error fetching data:", err));
    }, [sendTrueBool]);

    return { data, imageSrc, fetchData, checkNewImage };
}