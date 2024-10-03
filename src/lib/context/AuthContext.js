"use client";
import { createContext, useEffect, useReducer } from "react";


const INITIAL_STATE = {
    user: {},
    accessLevel: "",
    loading: false,
    error: null,
}

export const AuthContext = createContext({ state: INITIAL_STATE, dispatch: () => null });

const AuthReducer = (state, action) => {
    switch (action.type) {
        case "LOGIN_START":
            return {
                user: null,
                accessLevel: "",
                loading: true,
                error: null,
            };
        case "LOGIN_SUCCESS":
            return {
                user: action.payload,
                accessLevel: action.payload.access_level,
                loading: false,
                error: null,
            };
        case "LOGIN_FAILURE":
            return {
                user: null,
                accessLevel: "",
                loading: false,
                error: action.payload,
            };
        case "LOGOUT":
            return {
                user: null,
                accessLevel: "",
                loading: false,
                error: null,
            };
        default:
            return state;
    }
};

export const AuthContextProvider = ({ children }) => {
    const [state, dispatch] = useReducer(AuthReducer, INITIAL_STATE);

    useEffect(() => {
        localStorage.setItem("user", JSON.stringify(state.user));
    }, [state.user]);

    return (
        <AuthContext.Provider
            value={{ state, dispatch }}
        >
            {children}
        </AuthContext.Provider>
    );
};