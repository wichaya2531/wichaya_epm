'use client'
import { useEffect, useState } from "react";
import useSession from "./useSession";
import { config } from "@/config/config.js";


const useFetchCards = (refresh = null) => {
    const { session, isLoading: sessionLoading, error: sessionError } = useSession();
    const [cards, setCards] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchCard = async (user_id) => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await fetch(
                    `/api/user/get-card-from-user/${user_id}`
                    , { next: { revalidate: 10 } });
                if (!response.ok) {
                    throw new Error("Failed to fetch roles");
                }
                const data = await response.json();
                setCards(data.cards);
            } catch (error) {
                setError(error);
            } finally {
                setIsLoading(false);
            }
        };

        if (session) {
            fetchCard(session.user_id);
        }

        if (sessionError) {
            console.log(sessionError);
        }
    }, [session, refresh]);

    return { cards, isLoading, error };
}

export default useFetchCards;