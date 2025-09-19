'use client'
import { config } from "@/config/config.js";
import { useEffect, useState } from "react";



const useFetchUsersInWorkgroup = (workgroup_id,refresh) => {
    if(workgroup_id===undefined){
                return;
    }
    console.log('workgroup_id',workgroup_id);
    //const [users, setUsers] = useState([]);
    //const [loading, setLoading] = useState(true);
    //const [error, setError] = useState(null);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await fetch(`/api/user/get-users-in-workgroup/${workgroup_id}`, { next: { revalidate: 10 } });

                const data = await res.json();
                console.log("data users useFetchUsersInWorkgroup :",data);
                //setUsers(data.users);
                //setLoading(false);
            } catch (error) {
               // setError(error);
               //setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    return { refresh };
};

export default useFetchUsersInWorkgroup;