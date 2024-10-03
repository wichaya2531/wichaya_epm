

import { useState, useEffect } from 'react';
import { getSession } from '@/lib/utils/utils';

const useSession = () => {
    const [session, setSession] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    
    useEffect(() => {
        fetchSession();
    }, []);
    
    const fetchSession = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const resSession = await getSession();
            setSession(resSession);
        } catch (error) {
            setError(error);
        } finally {
            setIsLoading(false);
        }
    };
    
    return { session, isLoading, error };
}

export default useSession;
