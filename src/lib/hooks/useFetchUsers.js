'use client'
import { config } from "@/config/config.js";
import { useEffect, useState } from "react";


const useFetchUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await fetch(`/api/user/get-users`, { next: { revalidate: 10 } });
                const data = await res.json();
                setUsers(data.users);
                setLoading(false);
            } catch (error) {
                setError(error);
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    return { users, loading, error };
};

export default useFetchUsers;