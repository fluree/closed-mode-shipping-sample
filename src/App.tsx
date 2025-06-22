import { useCallback, useEffect, useMemo, useState } from 'react';
import './App.css';
import ShippingDashboard from './ShippingDashboard/ShippingDashboard';
import Notification from './ShippingDashboard/notification';
import FlureeClient from '@fluree/fluree-client';
import type { Item, Location, Shipment, User } from './ShippingDashboard/types';

const getMessageFromError = (err: unknown) => {
  if (err && typeof err === "object" && "body" in err && err.body && typeof err.body === "object" && "message" in err.body) {
    // Now TypeScript knows err.body.message exists
    return (err as { body: { message: string } }).body.message;
  } else {
    return "Unknown error";
  }
}

function App() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const [loggedInUser, setLoggedInUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [shouldReload, setShouldReload] = useState<boolean>(false);

  const [showNotification, setShowNotification] = useState<boolean>(false);
  const [notificationSuccess, setNotificationSuccess] = useState<boolean>(true);
  const [notificationTitle, setNotificationTitle] = useState<string>("");
  const [notificationDetail, setNotificationDetail] = useState<string>("");
  const onCloseNotification = () => { setShowNotification(false); };


  // The keys below are for the sample users in this demo. In a real application, you would manage these keys securely.
  // The private keys are used to sign messages, and the public keys are used to verify signatures.
  // The `did` is a Decentralized Identifier that uniquely identifies the user in the Fluree network.
  // The `did` is derived from the public key, and the private key is used to sign messages.

  // There are many ways to handle signing:
  // 1. Users could manage their own keys, like in a decentralized app and the client app would sign messages
  //    this method could incorporate a browser extension like MetaMask, or a mobile wallet app like Rainbow, etc. 
  // 2. or your backend app can manage keys on behalf of users, like in a traditional app and sign messages for them
  //    this method could incorporate a key management service (KMS) or upstream identity info from an IDP like Okta, Keycloak, etc.
  const rootPrivateKey = "8d542edcd3a11b4ca5faabe7c9fa09045d6f489b9461518dbd86c6c9e3b21fec";
  const privateKeys = useMemo<{ [key: string]: string }>(() => {
    return {
      "user/1": "5bb8029c4d914e92842a5b3d80f413484b10089430386d153415e4b2605096f2",
      "user/2": "6c0f0144b50a6bd0b64f450527604f42b6932bad553bf8f36b507b77f407e8fd",
      "user/3": "cfcb17068e1c018a8bf63aaebcca169c3b16d3c87abb320b0cebd5142748b07a",
      "user/4": "0f2c48b0a48627b1417f3f9cfacb5c4833525b376216921f518055c50334b1d6",
    };
  }, []);

  /*

    did
    publicKey
    privateKey

    did:fluree:Tf5Z5F4u8nmccw2cmhYxfpSPAbpi8yoVBFZ 
    036a1eaeb0c53edc59c6d68a2eb9ae1e291ad4d074602cf91a2479bacf0638b87f 
    5bb8029c4d914e92842a5b3d80f413484b10089430386d153415e4b2605096f2

    did:fluree:Tf14ycJ2bB9ty3aXxCoZpoUuj5hN21g328t 
    03c8a5ab3cc45c2c5d9ee8d6abe7bcf0c1b0b8a37a97e66b42ff8839e32f54ac47 
    6c0f0144b50a6bd0b64f450527604f42b6932bad553bf8f36b507b77f407e8fd

    did:fluree:Tf4BJt2j6JoUYGSSwr5SvRt8mz1pHYFdERg 
    0372d5c4e1f2114ca9d719e4e492297ee56c0d89dfb5e73cf9db97b850ee7cfcd2 
    cfcb17068e1c018a8bf63aaebcca169c3b16d3c87abb320b0cebd5142748b07a

    did:fluree:TezE9Vhwrctc275D2PVdf1iw1UcXgcrQMNo 
    0284206bd37f60f23194e95a7c652e93894b952a230bd870c9e9e33480d5ff5604 
    0f2c48b0a48627b1417f3f9cfacb5c4833525b376216921f518055c50334b1d6
    
  */

  const flureeClient = useMemo(async () => {
    const client = new FlureeClient({
      isFlureeHosted: false,
      ledger: "shipping-sample",
      host: "http://localhost",
      port: 8090,
      privateKey: loggedInUser?.id ? privateKeys[loggedInUser.id] : rootPrivateKey,  // default to root key if no user is logged in
      signMessages: true,
      defaultContext: {
        "id": "@id",
        "type": "@type",
        "xsd": "http://www.w3.org/2001/XMLSchema#",
        "location": { "@type": "@id" },
        "company": { "@type": "@id" },
        "fromLocation": { "@type": "@id" },
        "toLocation": { "@type": "@id" },
        "initiatedBy": { "@type": "@id" },
        "items": { "@type": "@id", "@container": "@set" },
        "shippedDate": { "@type": "xsd:dateTime" },
        "deliveredDate": { "@type": "xsd:dateTime" }
      }
    });
    await client.connect();
    return client;
  }, [privateKeys, loggedInUser]);

  const fetchData = useCallback(async () => {
    try {
      const client = await flureeClient;
      const shipmentsData = await client.query({
        "select": { "?shipments": [
          "id",
          "trackingNumber",
          "fromLocation",
          "toLocation",
          "items",
          "initiatedBy",
          "status",
          "shippedDate",
          "deliveredDate"
        ] },
        "where": {
          "@id": "?shipments",
          "@type": "Shipment",
        }
      }).send();
      const locationsData = await client.query({
        "select": { "?locations": ["*"] },
        "where": {
          "@id": "?locations",
          "@type": "Location",
        }
      }).send();
      const itemsData = await client.query({
        "select": { "?items": ["*"] },
        "where": {
          "@id": "?items",
          "@type": "Item",
        }
      }).send();
      const usersData = await client.query({
        "select": { "?users": ["*"] },
        "where": {
          "@id": "?users",
          "@type": "User",
        }
      }).send();

      setShipments(shipmentsData);
      setLocations(locationsData);
      setItems(itemsData);
      setUsers(usersData);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }, [flureeClient]);

  useEffect(() => {
    if (shouldReload) {
      setShouldReload(false);
    }
    if (isLoading) {
      // Prevent multiple fetches
      return;
    }
    setIsLoading(true);
    fetchData();
    setIsLoading(false);
  }, [fetchData, isLoading, shouldReload]);

  const updateShipment = useCallback(async (shipmentId: string, updates: Partial<Shipment>) => {
    const client = await flureeClient;
    const nonEmptyUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, value]) => value !== undefined && value !== null)
    );
    const upsertTransaction = client.upsert({ 
      id: shipmentId,
      ...nonEmptyUpdates
    });
    try {
      await upsertTransaction.send();
      setShowNotification(true);
      setNotificationSuccess(true);
      setNotificationTitle("Success");
      setNotificationDetail("Shipment updated");

      setShouldReload(true);
    } catch (err: unknown) {
      setShowNotification(true);
      setNotificationSuccess(false);
      setNotificationTitle("Failure");
      setNotificationDetail(getMessageFromError(err));
    }
  }, [flureeClient]);

  return (
    <>
      <ShippingDashboard 
        isLoading={isLoading}
        shipments={shipments} 
        locations={locations} 
        items={items} 
        users={users} 
        loggedInUser={loggedInUser} 
        setLoggedInUser={setLoggedInUser} 
        updateShipment={updateShipment} 
      />
      <Notification 
        show={showNotification}
        handleClose={onCloseNotification}
        success={notificationSuccess}
        title={notificationTitle}
        detail={notificationDetail}
      />
    </>
  )
}

export default App
