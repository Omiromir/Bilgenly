import { useEffect, useState } from "react";
import { getMe } from "../../auth/api";

interface CurrentUser {
    userId: string;
    username: string;
    email: string;
    role: string;
}

export function useCurrentUser() {
    const [user, setUser] = useState<CurrentUser | null>(null);

    useEffect(() => {
        getMe()
            .then(setUser)
            .catch(() => setUser(null));
    }, []);

    return user;
}
// хук чтобы избавиться от хардкода