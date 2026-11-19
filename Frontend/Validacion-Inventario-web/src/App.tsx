import { useState } from "react";
import { ConnectionScreen } from "./features/connection/components/ConnectionScreen";
import { InventoryScreen } from "./features/physical-inventory/components/InventoryScreen";

function App() {
  const [connectionInfo, setConnectionInfo] = useState<{ server: string; database: string } | null>(null);

  if (!connectionInfo) {
    return <ConnectionScreen onConnected={(server, database) => setConnectionInfo({ server, database })} />;
  }

  return (
    <InventoryScreen
      server={connectionInfo.server}
      database={connectionInfo.database}
      onDisconnect={() => setConnectionInfo(null)}
    />
  );
}

export default App;
