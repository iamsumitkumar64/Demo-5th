"use client"

import { Provider } from "react-redux";
import { persistor, store } from "@/redux/store";
import { PersistGate } from "redux-persist/lib/integration/react";

export default function StoreProvideLayout({ children }: { children: React.ReactNode }) {

    return (
        <Provider store={store} >
            <PersistGate loading={null} persistor={persistor} >
                {children}
            </PersistGate>
        </Provider>
    );
}
