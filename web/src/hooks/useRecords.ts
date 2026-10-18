import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebase";
export function useRecords<T extends { id: string }>(
  name: string,
  userId: string,
  connectionId?: string,
) {
  const [state, setState] = useState<{
    rows: T[];
    loading: boolean;
    error: string;
  }>({ rows: [], loading: true, error: "" });
  useEffect(() => {
    setState({ rows: [], loading: true, error: "" });
    const filters = [where("userId", "==", userId)];
    if (connectionId !== undefined)
      filters.push(where("connectionId", "==", connectionId));
    return onSnapshot(
      query(collection(db, name), ...filters),
      (snapshot) =>
        setState({
          rows: snapshot.docs.map(
            (doc) => ({ ...doc.data(), id: doc.id }) as T,
          ),
          loading: false,
          error: "",
        }),
      () =>
        setState({
          rows: [],
          loading: false,
          error:
            "Não foi possível carregar os dados. Verifique sua conexão e tente novamente.",
        }),
    );
  }, [name, userId, connectionId]);
  return state;
}
