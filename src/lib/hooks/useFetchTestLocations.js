import { useEffect, useState } from "react";
import { config } from "@/config/config.js";

const useFetchTestLocations = (refresh = null) => {
    const [locations, setLocations] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchLocations = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await fetch( `/api/location/get-locations`, { next: { revalidate: 10 } });
                if (!response.ok) {
                    throw new Error("Failed to fetch locations");
                }
                const data = await response.json();
                setLocations(data.locations);
            } catch (error) {
                setError(error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchLocations();
    }, [refresh]);

    return { locations, isLoading, error };
}

export default useFetchTestLocations;

