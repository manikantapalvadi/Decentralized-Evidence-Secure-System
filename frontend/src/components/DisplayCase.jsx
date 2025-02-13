import React, { useState } from "react";
import CryptoJS from "crypto-js";
import MapDisplay from "../miniComponents/MapDisplay";
import ShareAccess from "./ShareAccess";
import './global.js';

const userPrivateKey = Metamask_PrivateKey;

const DisplayCase = ({ state }) => {
    const { account, contract } = state;
    const [caseData, setCaseData] = useState([]);
    const [selectedCase, setSelectedCase] = useState(null);
    const [showShareAccess, setShowShareAccess] = useState(false);
    const [selectedCaseID, setSelectedCaseID] = useState(null);
    const [hasFetchedData, setHasFetchedData] = useState(false);
    const [showAllCases, setShowAllCases] = useState(false);
    const downloadFile = (name, data) => {
        const byteCharacters = atob(data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/octet-stream' });

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleViewDetails = async (caseID) => {
            const selected = caseID.decryptedCID;
            console.log(selected);
            if (selected) {
            try {
                const response = await fetch(`https://plum-legal-koi-674.mypinata.cloud/ipfs/${selected}`);
                if (response.ok) {
                    const responseData = await response.json();
                    setSelectedCase({ ...selected, files: responseData.filesData.files });
                } else {
                    console.log(`Error fetching data for CID: ${selected.decryptedCID}`);
                }
            } catch (error) {
                console.error(`Error fetching data for CID: ${selected.decryptedCID}`, error);
            }
        }
    };
    
    const getCaseData = async () => {
        const otherAddress = document.querySelector("#acc").value;
        // console.log("otherAddress: " + otherAddress);
        // console.log(await contract.displayCases(account));
        if ((otherAddress.length == 42 && otherAddress[0] == '0' && otherAddress[1] == 'x') || otherAddress.length == 0) {

            try {
                const dataArray = otherAddress
                    ? await contract.displayCases(otherAddress)
                    : await contract.displayCases(account);

                const decryptedDataArray = [];
                for (let i = 0; i < dataArray.length; i++) {
                    const caseID = dataArray[i];
                    const encryptedCID = await contract.getCaseData(caseID);
                    const decryptedCID = CryptoJS.AES.decrypt(encryptedCID.toString(), userPrivateKey).toString(CryptoJS.enc.Utf8);
                    decryptedDataArray.push({ caseID, decryptedCID });
                }
                setHasFetchedData(true);

                console.log(decryptedDataArray);
                setCaseData(decryptedDataArray);
                const logData = {
                    address: account,
                    caseName: 'N/A',
                    event: 'View Accessible Cases',
                    timestamp: new Date().toISOString(),
                    result: 'success'
                };
                await sendLogToServer(logData);

            } catch (e) {
                setHasFetchedData(false);
                alert("You don't have access or an error occurred");

                console.error(e);
                const logData = {
                    address: account,
                    caseName: 'N/A',
                    event: 'View Case',
                    timestamp: new Date().toISOString(),
                    result: 'error' + e.message
                };
                await sendLogToServer(logData);
            }
        } else {
            try {
                // const hasAccess = await contract.hasAccess(otherAddress);
                // if (hasAccess) {
                console.log(otherAddress);
                    const encryptedCID = await contract.getCaseData(otherAddress);
                    // setshowUsingCaseId(true);
                    const caseID = otherAddress;
                    const decryptedDataArray = encryptedCID.map((idx) => {

                       const decryptedCID =  CryptoJS.AES.decrypt(idx.toString(), userPrivateKey).toString(CryptoJS.enc.Utf8);
                       return {caseID, decryptedCID};
                    });
                    console.log(decryptedDataArray);
                    setHasFetchedData(true);
                    setCaseData(decryptedDataArray);
                    const logData = {
                        address: account,
                        caseName: 'N/A',
                        event: 'View Accessible Cases',
                        timestamp: new Date().toISOString(),
                        result: 'success'
                    };
                    await sendLogToServer(logData);
                // }
               
            } catch (e) {
                setHasFetchedData(false);
                alert(e.reason);
                console.log(e);
            }
        }
    };

    const handleShareAccess = (caseID) => {
        setSelectedCaseID(caseID);
        setShowShareAccess(true);
    };

    const sendLogToServer = async (logData) => {
        try {
            console.log('Log Data:', logData);
            const response = await fetch('http://localhost/logs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(logData)
            });
            const data = await response.json();
            console.log('Log sent successfully:', data);
        } catch (error) {
            console.error('Error sending log:', error);
        }
    };

    const closeModal = () => {
        setSelectedCase(null);
    };

    const casesToDisplay = showAllCases ? caseData : caseData.slice(0, 4);

    return (
        <div className="w-full min-h-screen p-10 mx-auto bg-gradient-to-b  from-indigo-900 to-black max-w-7xl">
            {/* Input Box Section */}
            <div className="p-5 flex gap-2 justify-center items-center">
                <input
                    type="text"
                    id="acc"
                    placeholder="Enter Account Address"
                    className="w-[50%] rounded-md h-10 px-5 py-1 shadow-md outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
                <button
                    className="w-[15%] h-10 rounded-md bg-blue-500 text-white shadow-lg hover:bg-blue-600 transition-all"
                    onClick={getCaseData}
                >
                    Get Data
                </button>
            </div>

            {/* Introductory Content */}
            {!hasFetchedData && (
                <div className="text-center text-white mb-10 space-y-4">
                    <h1 className="text-4xl font-bold tracking-wide text-indigo-300">
                        Welcome to <span className="text-blue-500">Blockchain Evidence Secure System</span>
                    </h1>
                    <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                        Access, manage, and share your blockchain-secured cases effortlessly.
                        Use the above input to retrieve data tied to a specific address.
                    </p>
                    <p className="text-sm text-gray-500">
                        Powered by decentralized technology for enhanced security and transparency.
                    </p>
                </div>
            )}

            {/* Cases Grid */}
            {caseData.length > 0 && (
                <div className="mt-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {casesToDisplay.map((item, index) => (
                            <div
                                key={index}
                                className="bg-slate-700 p-4 rounded-md shadow-lg hover:scale-105 transition-transform duration-200"
                            >
                                <MapDisplay title="caseID" text={item.caseID} />
                                <div className="mt-2 flex gap-4">
                                    <button
                                        className="mt-2 text-blue-500 hover:text-blue-700"
                                        onClick={() => handleViewDetails(item)}
                                    >
                                        View Details
                                    </button>
                                    <button
                                        className="mt-2 text-blue-500 hover:text-blue-700"
                                        onClick={() => handleShareAccess(item.caseID)}
                                    >
                                        Manage Access
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    {caseData.length > 4 && (
                        <div className="text-center mt-6">
                            <button
                                className="text-blue-500 hover:text-blue-700"
                                onClick={() => setShowAllCases(!showAllCases)}
                            >
                                {showAllCases ? "Show Less" : "Show More"}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {showShareAccess && (
                <ShareAccess
                    state={state}
                    selectedCaseID={selectedCaseID}
                    onClose={() => setShowShareAccess(false)}
                />
            )}

            {/* Modal for Viewing Details */}
            {selectedCase && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-slate-700 p-6 rounded-md max-w-lg w-full shadow-lg">
                        <button
                            className="text-red-500 hover:text-red-700 float-right"
                            onClick={closeModal}
                        >
                            Close
                        </button>
                        <MapDisplay title="caseID" text={selectedCase.caseID} />
                        <div className="mt-4">
                            {selectedCase.files.map((file, idx) => (
                                <div key={idx} className="flex items-center">
                                    <span className="mr-2 text-yellow-500">{file.name}</span>
                                    <button
                                        className="text-blue-500 hover:text-blue-700"
                                        onClick={() => downloadFile(file.name, file.data)}
                                    >
                                        Download
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DisplayCase;
