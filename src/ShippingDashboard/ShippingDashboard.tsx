import { Package, MapPin, User as UserIcon, CheckCircle, Clock, Truck } from 'lucide-react';

import type { Shipment, ShipmentStatus, Location, Item, User, Entity } from './types';
// import { useCallback, useMemo } from 'react';

type ShippingDashboardProps = {
    isLoading: boolean;
    shipments: Shipment[];
    locations: Location[];
    items: Item[];
    users: User[];
    loggedInUser: User | null;
    setLoggedInUser: (user: User | null) => void;
    updateShipment: (shipmentId: string, updates: Partial<Shipment>) => void;
};

const ShippingDashboard = ({ isLoading, shipments, locations, items, users, loggedInUser, setLoggedInUser, updateShipment }: ShippingDashboardProps) => {
    // Helper functions
    const getLocationById = (id: string) => locations.find(loc => loc.id === id);
    const getItemById = (id: string) => items.find(item => item.id === id);
    const getUserById = (id: string) => users.find(user => user.id === id);

    // Check if user can confirm receipt of a shipment
    const canConfirmReceipt = (shipment: Shipment) => {
        // return shipment.status === "In Transit" && shipment.toLocation.id === user.location.id;
        return shipment.status === "In Transit";
    };

    // Check if user can ship out a pending shipment
    const canShipOut = (shipment: Shipment) => {
        // return shipment.status === "Pending" && shipment.fromLocation.id === user.location.id;
        return shipment.status === "Pending";
    };

    // Confirm receipt handler
    const handleConfirmReceipt = (shipmentId: string) => {
        updateShipment(shipmentId, { status: "Delivered", deliveredDate: new Date().toISOString() });
    };

    // Ship out handler
    const handleShipOut = (shipmentId: string) => {
        updateShipment(shipmentId, { status: "In Transit", shippedDate: new Date().toISOString() });
    };

    // Status icon component
    const StatusIcon = ({ status }: { status: ShipmentStatus }) => {
        switch (status) {
            case "Delivered":
                return <CheckCircle className="w-5 h-5 text-green-600" />;
            case "In Transit":
                return <Truck className="w-5 h-5 text-blue-600" />;
            case "Pending":
                return <Clock className="w-5 h-5 text-yellow-600" />;
            default:
                return <Clock className="w-5 h-5 text-gray-600" />;
        }
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString() + " " + new Date(dateString).toLocaleTimeString();
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Supply Chain Tracking Demo</h1>

                {/* User Selection */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        "Login" with a profile
                    </label>
                    <select
                        value={loggedInUser?.id}
                        onChange={(e) => setLoggedInUser(users.find(u => u.id === e.target.value) || users[0])}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                        {!loggedInUser &&
                            <option value="">-- Choose a user to see relevant shipments --</option>
                        }
                        {users.map(user => (
                            <option key={user.id} value={user.id}>
                                {user.name} - {user.role} ({getLocationById(user.location.id)?.name})
                            </option>
                        ))}
                    </select>
                </div>

                {/* Current User Info */}
                {loggedInUser && (
                    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                        <div className="flex items-center space-x-4">
                            <UserIcon className="w-8 h-8 text-blue-600" />
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">{loggedInUser.name}</h2>
                                <p className="text-gray-600">{loggedInUser.role}</p>
                                <div className="flex items-center space-x-2 text-sm text-gray-500">
                                    <MapPin className="w-4 h-4" />
                                    <span>{getLocationById(loggedInUser.location.id)?.name}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Shipments Table */}
                {!loggedInUser && !isLoading && (
                    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                        <h3 className="text-lg font-semibold text-gray-900">Select a user to view their shipments</h3>
                        <p className="text-sm text-gray-600">Please select a user profile to see their shipments.</p>
                    </div>
                )}
                {loggedInUser && isLoading && (
                    <div className="bg-white rounded-lg shadow-md p-6 mb-6 text-center">
                        <p className="text-gray-500">Loading shipments...</p>
                    </div>
                )}
                {loggedInUser && !isLoading && (
                    <div className="bg-white rounded-lg shadow-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">Your Shipments</h3>
                            <p className="text-sm text-gray-600">Shipments you've initiated or that affect your location</p>
                        </div>

                        {shipments.length === 0 ? (
                            <div className="px-6 py-8 text-center text-gray-500">
                                No shipments found for your profile.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Tracking Number
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Route
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Items
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Dates
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {shipments.map((shipment) => (
                                            <tr key={shipment.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {shipment.trackingNumber}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center space-x-2">
                                                        <StatusIcon status={shipment.status} />
                                                        <span className="text-sm text-gray-900">{shipment.status}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-900">
                                                    <div className="space-y-1">
                                                        <div><strong>From:</strong> {getLocationById(shipment.fromLocation.id)?.name}</div>
                                                        <div><strong>To:</strong> {getLocationById(shipment.toLocation.id)?.name}</div>
                                                        <div className="text-xs text-gray-500">
                                                            Initiated by: {getUserById(shipment.initiatedBy.id)?.name}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="space-y-2">
                                                        {shipment.items.map((itemEntity: Entity) => {
                                                            const item = getItemById(itemEntity.id);
                                                            return (
                                                                <div key={itemEntity.id} className="flex items-center space-x-2 text-sm">
                                                                    <Package className="w-4 h-4 text-gray-400" />
                                                                    <span className="font-medium">{item?.sku}</span>
                                                                    <span className="text-gray-600">({item?.color} {item?.size})</span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-900">
                                                    <div className="space-y-1">
                                                        {shipment.shippedDate ? (
                                                            <div><strong>Shipped:</strong> {formatDate(shipment.shippedDate)}</div>
                                                        ) : (
                                                            <div><strong>Status:</strong> Not yet shipped</div>
                                                        )}
                                                        {shipment.deliveredDate && (
                                                            <div><strong>Delivered:</strong> {formatDate(shipment.deliveredDate)}</div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    {canConfirmReceipt(shipment) ? (
                                                        <button
                                                            onClick={() => handleConfirmReceipt(shipment.id)}
                                                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                                                        >
                                                            Confirm Receipt
                                                        </button>
                                                    ) : canShipOut(shipment) ? (
                                                        <button
                                                            onClick={() => handleShipOut(shipment.id)}
                                                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                                                        >
                                                            Ship Out
                                                        </button>
                                                    ) : (
                                                        <span className="text-gray-400">No action available</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ShippingDashboard;