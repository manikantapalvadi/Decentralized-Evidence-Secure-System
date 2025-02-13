import React, { useState } from 'react';
import CryptoJS from 'crypto-js';
import './global.js';

const UploadCase = ({ state }) => {
  const { account, contract } = state;

  const [caseName, setCaseName] = useState('');
  const [numFiles, setNumFiles] = useState(0);
  const [fileInputs, setFileInputs] = useState([]);
  const [fileArray, setFileArray] = useState([]);
  const [uniqueCaseID, setUniqueCaseID] = useState('');
  const [filePreview, setFilepreview] = useState([]);
  const handleFileInputChange = (event) => {
    const files = event.target.files;

    if (files.length <= 8) {
      const newFileArray = [...fileArray]; // Clone the current fileArray
      const newFilePreviewArray = [...filePreview];
      Array.from(files).forEach((file, idx) => {
        const reader = new FileReader();

        reader.onload = () => {
          const fileData = reader.result.split(',')[1];

          newFileArray[idx] = {
            name: file.name,
            data: fileData,
          };

          newFilePreviewArray[idx] = {
            preview : reader.result,
            name : file.name,
            size : file.size,
          };

          // Update state only once all files are processed
          setFileArray([...newFileArray]);
          setFilepreview([...newFilePreviewArray]);
        };

        reader.readAsDataURL(file);
      });
    } else {
      alert('You can upload a maximum of 8 files.');
    }
  };

  const handleUpload = async event => {
    event.preventDefault();

    const hash = CryptoJS.SHA256(caseName);
    const hashedCaseID = hash.toString(CryptoJS.enc.Hex);
    setUniqueCaseID(hashedCaseID);

    const filesData = {
      files: fileArray,
      uniqueCaseID: caseName + hashedCaseID,
    };


    const userPrivateKey = Metamask_PrivateKey;
    const IPFS_Key = IPFS_key_from_pinata;
    const options = {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + IPFS_Key,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pinataContent: {
          filesData,
        },
        pinataMetadata: {
          name: caseName + '.json',
        },
        pinataOptions: {
          cidVersion: 1,
        },
      }),
    };

    try {
      const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', options);
      const data = await response.json();

      if (data && data.IpfsHash) {
        const encryptedCID = CryptoJS.AES.encrypt(data.IpfsHash, userPrivateKey).toString();
        console.log(data.IpfsHash);
        console.log(encryptedCID);

        const transaction = await contract.addCase(caseName, encryptedCID);
        const receipt = await transaction.wait();

        if (receipt.status === 1) {
          alert('Transaction Successful');
          console.log(transaction);
          // const caseData = await contract.getCaseData(caseName);
          // console.log('Case Data:', caseData);
        } else {
          alert('Transaction failed');
        }
        const logData = {
          address: account,
          caseName: caseName,
          event: 'Add case',
          timestamp: new Date().toISOString(),
          result: receipt.status === 1 ? 'success' : 'failed',
        };
        await sendLogToServer(logData);
        window.location.reload();
      } else {
        console.log('Invalid CID received from IPFS');
      }
    } catch (err) {
      console.log(err);
      const logData = {
        address: account,
        caseName: caseName,
        event: 'Add case',
        timestamp: new Date().toISOString(),
        result: 'error - ' + err.message
      };
      await sendLogToServer(logData);
    }
  };

  const sendLogToServer = async (logData) => {
    try {
      console.log('Log Data:', logData);
      const response = await fetch('http://localhost:5000/logs', {
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

  return (
    <div className="flex p-10 items-center justify-center min-h-screen bg-gray-900">
    <div className="bg-gray-800 rounded-lg shadow-xl p-8 max-w-4xl w-full">
      <h2 className="text-2xl font-semibold text-white text-center mb-6">Upload Case</h2>
      <form onSubmit={handleUpload} className="space-y-6">
        <div>
          <label htmlFor="account" className="block text-sm font-medium text-gray-300">
            Connected Account
          </label>
          <input
            type="text"
            id="account"
            value={account}
            readOnly
            className="block w-full px-4 py-2 mt-2 text-sm bg-gray-700 border border-gray-600 rounded-lg text-gray-300 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label htmlFor="caseName" className="block text-sm font-medium text-gray-300">
            Unique Case Name
          </label>
          <input
            type="text"
            id="caseName"
            value={caseName}
            onChange={(e) => setCaseName(e.target.value)}
            required
            className="block w-full px-4 py-2 mt-2 text-sm bg-gray-700 border border-gray-600 rounded-lg text-gray-300 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Upload Files (Max: 8)
          </label>
          <div className="relative border-dashed border-2 border-gray-600 py-12 flex flex-col justify-center items-center rounded-lg bg-gray-700">
            <input
              id="file-upload"
              type="file"
              multiple
              className="hidden"
              onChange={handleFileInputChange}
            />
            <label
              htmlFor="file-upload"
              className="flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg cursor-pointer hover:bg-blue-700"
            >
              Drag & Drop or Click to Upload
            </label>
            <p className="mt-2 text-sm text-gray-400">Supported formats: .jpg, .png, .pdf</p>
          </div>
          {fileArray.length > 0 && (
            <ul className="mt-4 grid grid-cols-2 gap-4">
              {filePreview.map((file, index) => (
                <li
                  key={index}
                  className="flex items-center justify-between p-2 bg-gray-700 rounded-lg"
                >
                  <div>
                    <p className="text-sm text-gray-300 truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">{Math.round(file.size / 1024)} KB</p>
                  </div>
                  <button
                    className="text-sm text-red-400 hover:underline"
                    onClick={(event) => {
                      event.preventDefault();
                      const updatedFiles = fileArray.filter((_, i) => i !== index);
                      setFileArray(updatedFiles);
                    }}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button
          type="submit"
          className="w-full px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:ring-4 focus:ring-green-500"
        >
          Save on Blockchain
        </button>
      </form>
    </div>
  </div>
  );
};

export default UploadCase;
