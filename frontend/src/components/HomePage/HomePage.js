import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import api from "../../api/api";

import "../../App.css"; 
import "./HomePage.css";

// 🟢 REAL-WORLD CAR DATA WITH LUXURY FACTORS
const CAR_DATA = {
  "Maruti Suzuki": {
    factor: 1.0, // Base Price
    models: [
      { name: "Alto K10", type: "Hatchback" }, { name: "S-Presso", type: "Hatchback" },
      { name: "Wagon R", type: "Hatchback" }, { name: "Celerio", type: "Hatchback" },
      { name: "Swift", type: "Hatchback" }, { name: "Baleno", type: "Hatchback" },
      { name: "Dzire", type: "Sedan" }, { name: "Ciaz", type: "Sedan" },
      { name: "Brezza", type: "SUV" }, { name: "Grand Vitara", type: "SUV" },
      { name: "Ertiga", type: "MPV" }, { name: "Fronx", type: "SUV" }
    ]
  },
  "Hyundai": {
    factor: 1.2, // 20% more expensive parts
    models: [
      { name: "Grand i10 Nios", type: "Hatchback" }, { name: "i20", type: "Hatchback" },
      { name: "Aura", type: "Sedan" }, { name: "Verna", type: "Sedan" },
      { name: "Exter", type: "SUV" }, { name: "Venue", type: "SUV" },
      { name: "Creta", type: "SUV" }, { name: "Tucson", type: "SUV" }
    ]
  },
  "Tata": {
    factor: 1.1, // 10% more expensive
    models: [
      { name: "Tiago", type: "Hatchback" }, { name: "Tigor", type: "Sedan" },
      { name: "Altroz", type: "Hatchback" }, { name: "Nexon", type: "SUV" },
      { name: "Punch", type: "SUV" }, { name: "Harrier", type: "SUV" },
      { name: "Safari", type: "SUV" }
    ]
  },
  "Mahindra": {
    factor: 1.3, // Rugged parts, slightly costlier
    models: [
      { name: "Bolero", type: "SUV" }, { name: "XUV300", type: "SUV" },
      { name: "Thar", type: "SUV" }, { name: "Scorpio N", type: "SUV" },
      { name: "XUV700", type: "SUV" }
    ]
  },
  "Honda": {
    factor: 1.4,
    models: [
      { name: "Amaze", type: "Sedan" }, { name: "City", type: "Sedan" },
      { name: "Elevate", type: "SUV" }
    ]
  },
  "Toyota": {
    factor: 1.5, // Premium parts
    models: [
      { name: "Glanza", type: "Hatchback" }, { name: "Urban Cruiser", type: "SUV" },
      { name: "Innova Crysta", type: "MPV" }, { name: "Fortuner", type: "SUV" }
    ]
  },
  "Kia": {
    factor: 1.25,
    models: [
      { name: "Sonet", type: "SUV" }, { name: "Seltos", type: "SUV" },
      { name: "Carens", type: "MPV" }
    ]
  },
  "Volkswagen": {
    factor: 1.8, // German Engineering Premium
    models: [
      { name: "Polo", type: "Hatchback" }, { name: "Virtus", type: "Sedan" },
      { name: "Taigun", type: "SUV" }
    ]
  },
  "BMW": {
    factor: 3.5, // Luxury Segment
    models: [
      { name: "3 Series", type: "Sedan" }, { name: "5 Series", type: "Sedan" },
      { name: "X1", type: "SUV" }, { name: "X3", type: "SUV" },
      { name: "X5", type: "SUV" }
    ]
  },
  "Mercedes-Benz": {
    factor: 3.8, // High Luxury
    models: [
      { name: "A-Class", type: "Sedan" }, { name: "C-Class", type: "Sedan" },
      { name: "E-Class", type: "Sedan" }, { name: "GLA", type: "SUV" },
      { name: "GLC", type: "SUV" }
    ]
  },
  "Audi": {
    factor: 3.4,
    models: [
      { name: "A4", type: "Sedan" }, { name: "A6", type: "Sedan" },
      { name: "Q3", type: "SUV" }, { name: "Q5", type: "SUV" }
    ]
  }
};

const formatCurrency = (value) => `Rs. ${Number(value || 0).toFixed(2)}`;

const UploadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const MultipleClaimsBanner = ({ claimCount }) => {
  if (claimCount === 1) {
    return (
      <div className="banner-message warning">
        <strong>⚠️ This is your 2nd claim within 1 year.</strong>
        <p>Please note: Your claim amount may be reduced as per your policy's multiple claim clause.</p>
      </div>
    );
  }
  if (claimCount >= 2) {
    return (
      <div className="banner-message danger">
        <strong>❗ You have submitted {claimCount} claims this year.</strong>
        <p>Insurance coverage for this claim will be significantly reduced as per policy terms.</p>
      </div>
    );
  }
  return null;
};

const CarHeatmap = ({ lineItems }) => {
  const safeItems = Array.isArray(lineItems) ? lineItems : [];
  const isDamaged = (partName) => safeItems.some((item) => item.part && item.part.toLowerCase().includes(partName));

  return (
    <div className="heatmap-container" style={{ textAlign: "center", marginTop: "20px" }}>
      <h4>🚗 Damage Heatmap</h4>
      <svg width="200" height="300" viewBox="0 0 200 300" xmlns="http://www.w3.org/2000/svg">
        <rect x="50" y="20" width="100" height="260" rx="15" fill="#e0e0e0" stroke="#333" strokeWidth="2" />
        <path d="M 60 80 Q 100 70 140 80 L 140 110 Q 100 100 60 110 Z" fill={isDamaged("windscreen") ? "#ff4d4d" : "#87CEEB"} stroke="black" />
        <path d="M 55 25 Q 100 15 145 25 L 145 75 Q 100 65 55 75 Z" fill={isDamaged("bonnet") || isDamaged("hood") ? "#ff4d4d" : "white"} stroke="black" />
        <path d="M 50 20 Q 100 10 150 20 L 150 40 Q 100 30 50 40 Z" fill={isDamaged("bumper") ? "#ff4d4d" : "#ccc"} stroke="black" />
        <rect x="52" y="120" width="10" height="60" fill={isDamaged("door") ? "#ff4d4d" : "white"} stroke="black" />
        <rect x="138" y="120" width="10" height="60" fill={isDamaged("door") ? "#ff4d4d" : "white"} stroke="black" />
      </svg>
      <p style={{ fontSize: "0.8rem", color: "#666" }}>Red areas indicate detected damage.</p>
    </div>
  );
};

function HomePage() {
  const [step, setStep] = useState(1);
  const [claimId, setClaimId] = useState(null);
  const [userClaimCount, setUserClaimCount] = useState(0);
  
  const [claimDetails, setClaimDetails] = useState({
    vin: "",
    make: "",
    model: "",
    vehicleRegistrationNumber: "",
    vehicleMakeModel: "",
    yearOfManufacture: "",
    fuelType: "Petrol",
    odometerReading: "",
    chassisNumber: "",
    engineNumber: "",
    dateOfIncident: "",
    location: "",
    claimReason: "",
    incidentDescription: "",
    firstName: "",
    lastName: "",
    mobileNumber: "",
    email: "",
    aadharNumber: "",
    drivingLicenseNumber: "",
    address: "",
    insuranceCompany: "",
    policyNumber: "",
    policyExpiryDate: "",
    claimNumber: "",
    isFirFiled: false,
    firNumber: "",
    preferredGarage: "",
    needsPickup: false,
    urgency: "Medium",
    budgetEstimate: "",
    insuredDeclaredValue: "",
    hasZeroDepreciationCover: false,
    luxuryFactor: 1.0 
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedMake, setSelectedMake] = useState("");
  const [availableModels, setAvailableModels] = useState([]);

  useEffect(() => {
    const fetchClaimCount = async () => {
      try {
        const response = await api.get("/claims/user/details");
        const count = response.data.claimIds ? response.data.claimIds.length : 0;
        setUserClaimCount(count);
      } catch (e) {
        console.error("Failed to fetch user claim count:", e);
        setUserClaimCount(0);
      }
    };
    fetchClaimCount();
  }, []);

  const nextClaimDisplayId = userClaimCount + 1;

  const handleMakeChange = (e) => {
      const make = e.target.value;
      setSelectedMake(make);
      
      if (make && CAR_DATA[make]) {
          setAvailableModels(CAR_DATA[make].models);
          setClaimDetails(prev => ({
              ...prev,
              make: make,
              model: "",
              vehicleMakeModel: make, 
              luxuryFactor: CAR_DATA[make].factor
          }));
      } else {
          setAvailableModels([]);
          setClaimDetails(prev => ({ ...prev, make: "", model: "", luxuryFactor: 1.0 }));
      }
  };

  const handleModelChange = (e) => {
      const modelName = e.target.value;
      setClaimDetails(prev => ({
          ...prev,
          model: modelName,
          vehicleMakeModel: `${selectedMake} ${modelName}`
      }));
  };

  const handleDetailChange = (event) => {
    const { name, value, type, checked } = event.target;
    setClaimDetails((prevDetails) => ({
      ...prevDetails,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleDetailsSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const response = await api.post("/claims", claimDetails);
      setClaimId(response.data.id);
      setStep(2);
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to save details. Please check all fields and try again.";
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("Please select a valid image file (png, jpg, jpeg).");
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setError("");
    }
  };

  const handleImageSubmit = async (event) => {
    event.preventDefault();
    if (!selectedFile || !claimId) {
      setError("Please select an image file or ensure claim ID exists.");
      return;
    }
    setIsLoading(true);
    setError("");
    const formData = new FormData();
    formData.append("image", selectedFile);
    try {
      const response = await api.post(`/claims/${claimId}/estimate`, formData);
      setResult(response.data);
    } catch (err) {
      setError("An error occurred during image analysis. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const generatePdfReport = () => {
    if (!result) return;
    const doc = new jsPDF();
    const { analysis = {}, estimate = {} } = result || {};
    const lineItems = estimate.lineItems || [];
    const total = Number(estimate.total || 0);
    const subtotal = Number(estimate.subtotal || 0);
    const { vehicleRegistrationNumber, vehicleMakeModel, firstName, lastName } = claimDetails;
    const displayClaimId = nextClaimDisplayId;

    doc.setFontSize(22); doc.setFont(undefined, "bold");
    doc.text("AI Damage Analysis Report", 105, 20, { align: "center" });
    doc.setLineWidth(0.5); doc.line(15, 25, 195, 25);
    doc.setFontSize(10); doc.setFont(undefined, "normal");
    doc.text(`Claim ID (User-Specific): #${displayClaimId}`, 15, 32);
    doc.text(`Real Claim ID (Internal): #${claimId}`, 15, 37);
    doc.text(`Vehicle: ${vehicleMakeModel} (${vehicleRegistrationNumber})`, 15, 42);
    doc.text(`Client: ${firstName} ${lastName}`, 15, 47);
    doc.text(`Report Date: ${new Date().toLocaleDateString()}`, 195, 32, { align: "right" });

    autoTable(doc, {
      startY: 55,
      head: [["Metric", "Result"]],
      body: [
        ["Damage Detected", analysis.isDamaged ? "Yes" : "No"],
        ["Detection Confidence", analysis.damageConfidence ? `${(analysis.damageConfidence * 100).toFixed(2)}%` : "N/A"],
        ["Estimated Severity", analysis.damageSeverity?.severityLabel || "N/A"],
        [{ content: "Total Estimated Cost", styles: { fontStyle: "bold" } }, { content: formatCurrency(total), styles: { fontStyle: "bold" } }],
      ],
      theme: "grid", headStyles: { fillColor: "#2c3e50" },
    });
    
    const lastTableY = doc.lastAutoTable.finalY;
    if (analysis.plottedImage) {
        doc.setFontSize(14); doc.text("Visual Evidence", 15, lastTableY + 15);
        const imgData = `data:image/jpeg;base64,${analysis.plottedImage}`;
        doc.addImage(imgData, "JPEG", 15, lastTableY + 20, 180, 100, undefined, "FAST");
        doc.addPage();
    }

    doc.setFontSize(18); doc.text("Detailed Cost Breakdown", 15, 20);
    autoTable(doc, {
      startY: 30,
      head: [["Part", "Damage Type", "Recommended Action", "Estimated Amount"]],
      body: lineItems.map((item) => [item.part, item.damageType, item.action, formatCurrency(item.amount)]),
      theme: "striped", headStyles: { fillColor: "#2c3e50" },
      didDrawPage: (data) => {
        const finalY = data.cursor.y;
        doc.setFontSize(12);
        doc.text(`Subtotal: ${formatCurrency(subtotal)}`, data.settings.margin.left, finalY + 10);
        doc.setFont(undefined, "bold");
        doc.text(`Total (incl. Tax): ${formatCurrency(total)}`, data.settings.margin.left, finalY + 17);
      },
    });
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(`Page ${i} of ${pageCount}`, 195, 290, { align: "right" });
      doc.text("Report generated by AI Estimator", 15, 290);
    }
    doc.save(`Damage-Report-${claimId}.pdf`);
  };

  const renderResults = () => {
    if (!result) return null;
    const { analysis = {}, estimate = {} } = result || {};
    const lineItems = estimate.lineItems || [];
    const totalCost = Number(estimate.total || 0);
    const subtotal = Number(estimate.subtotal || 0);
    const tax = Number(estimate.tax || 0);
    const hasDamage = lineItems.length > 0 || totalCost > 0;

    return (
      <div className="report-container">
        <div className="banner-message warning" style={{ textAlign: "center", borderLeft: "5px solid #ffc107" }}>
          <strong>✅ AI Analysis Successful!</strong>
          <p>Your claim estimate has been generated. Please wait for an Admin to verify and approve this claim.</p>
        </div>
        <div className="report-header">
          <h2>Analysis & Cost Estimate for Claim ID: #{nextClaimDisplayId}</h2>
          <button onClick={generatePdfReport} className="download-pdf-button">Download PDF Report</button>
        </div>
        <div className="summary-grid">
          <div className="summary-card total-cost-card">
            <span className="card-title">Total Estimated Cost</span>
            <span className="card-value large-value">{formatCurrency(totalCost)}</span>
          </div>
          <div className="summary-card">
            <span className="card-title">Damage Severity</span>
            <span className={`card-value severity-${analysis.damageSeverity?.severityLabel?.toLowerCase() || "n-a"}`}>
              {analysis.damageSeverity?.severityLabel || "N/A"}
            </span>
          </div>
          <div className="summary-card">
            <span className="card-title">Damage Detected</span>
            <span className="card-value">{hasDamage ? "Yes" : "No"}</span>
          </div>
          <div className="summary-card">
            <span className="card-title">Detection Confidence</span>
            <span className="card-value">{analysis.damageConfidence ? `${(analysis.damageConfidence * 100).toFixed(1)}%` : "N/A"}</span>
          </div>
        </div>
        <div className="main-content-grid">
          {analysis.plottedImage && (
            <div className="report-card visual-evidence-card">
                <h3>Visual Evidence</h3>
                <img src={`data:image/jpeg;base64,${analysis.plottedImage}`} alt="Vehicle with damage detections" />
                <CarHeatmap lineItems={lineItems} />
            </div>
          )}
          <div className="report-card breakdown-card">
            <h3>Detailed Cost Breakdown</h3>
            <table className="report-table">
              <thead>
                <tr><th>Part</th><th>Damage Type</th><th>Action</th><th>Amount</th></tr>
              </thead>
              <tbody>
                {lineItems.map((item, index) => (
                  <tr key={index}><td>{item.part}</td><td>{item.damageType}</td><td>{item.action}</td><td>{formatCurrency(item.amount)}</td></tr>
                ))}
              </tbody>
            </table>
            <div className="report-totals">
              <p><span>Subtotal (Parts & Labor):</span><span>{formatCurrency(subtotal)}</span></p>
              <p><span>Tax (18% GST):</span><span>{formatCurrency(tax)}</span></p>
              {estimate.deductionAmount > 0 && (
                <>
                  <p className="original-total-row" style={{ textDecoration: "line-through", color: "#888" }}>
                    <span>Original Estimate:</span><span>{formatCurrency(estimate.originalTotal)}</span>
                  </p>
                  <p className="deduction-row" style={{ color: "#d9534f", fontWeight: "bold" }}>
                    <span>⚠️ {estimate.deductionReason}:</span><span>- {formatCurrency(estimate.deductionAmount)}</span>
                  </p>
                  <hr style={{ margin: "10px 0", borderTop: "1px solid #ccc" }} />
                </>
              )}
              <p className="total-row" style={{ fontSize: "1.4em", color: "#2c3e50" }}>
                <span>Final Payable Amount:</span><span>{formatCurrency(totalCost)}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="internal-page-wrapper">
      <h1 className="app-header-title">🤖AI Vehicle Damage Estimator</h1>
      <MultipleClaimsBanner claimCount={userClaimCount} />
      {step === 1 ? (
        <form onSubmit={handleDetailsSubmit} className="details-form large-form">
          <h2>Step 1: Provide Claim Details (Claim #{nextClaimDisplayId})</h2>
          <fieldset>
            <legend>🚗 Vehicle & Damage Details</legend>
            <input 
    name="vin" 
    value={claimDetails.vin} 
    onChange={(e) => {
        // Force Uppercase and limit to 17 chars (Standard VIN length)
        // If you strictly want 10, change 17 to 10 below
        const val = e.target.value.toUpperCase().slice(0, 17); 
        setClaimDetails(prev => ({ ...prev, vin: val }));
    }} 
    placeholder="VIN (17 Characters)" 
    required 
/>   
            {/* 🟢 NEW: Smart Dropdowns with Luxury Logic */}
            <div className="form-row" style={{display:'flex', gap:'20px', marginBottom:'15px'}}>
                <div className="input-wrapper" style={{flex:1}}>
                    <label style={{display:'block',marginBottom:'5px',fontWeight:'bold'}}>Car Make</label>
                    <select name="make" value={selectedMake} onChange={handleMakeChange} required style={{width:'100%', padding:'10px'}}>
                        <option value="">Select Make</option>
                        {Object.keys(CAR_DATA).map(make => <option key={make} value={make}>{make}</option>)}
                    </select>
                </div>
                <div className="input-wrapper" style={{flex:1}}>
                    <label style={{display:'block',marginBottom:'5px',fontWeight:'bold'}}>Car Model</label>
                    <select name="model" value={claimDetails.model} onChange={handleModelChange} disabled={!selectedMake} required style={{width:'100%', padding:'10px'}}>
                        <option value="">Select Model</option>
                        {availableModels.map(model => <option key={model.name} value={model.name}>{model.name} ({model.type})</option>)}
                    </select>
                </div>
            </div>

            <input 
    name="vehicleRegistrationNumber" 
    value={claimDetails.vehicleRegistrationNumber} 
    onChange={(e) => {
        // Force Uppercase and limit to 10 chars
        const val = e.target.value.toUpperCase().slice(0, 10); 
        setClaimDetails(prev => ({ ...prev, vehicleRegistrationNumber: val }));
    }} 
    placeholder="Reg Number (e.g. TN01AB1234)" 
    required 
/>
            <input name="yearOfManufacture" type="number" value={claimDetails.yearOfManufacture} onChange={handleDetailChange} placeholder="Year of Manufacture" required />
            <select name="fuelType" value={claimDetails.fuelType} onChange={handleDetailChange}>
              <option value="Petrol">Petrol</option>
              <option value="Diesel">Diesel</option>
              <option value="Electric">Electric</option>
            </select>
            <input name="odometerReading" type="number" value={claimDetails.odometerReading} onChange={handleDetailChange} placeholder="Odometer Reading (in km)" required />
            <input name="chassisNumber" value={claimDetails.chassisNumber} onChange={handleDetailChange} placeholder="Chassis Number (optional)" />
            <input name="engineNumber" value={claimDetails.engineNumber} onChange={handleDetailChange} placeholder="Engine Number (optional)" />
            <label>Date of Incident: <input name="dateOfIncident" type="date" value={claimDetails.dateOfIncident} onChange={handleDetailChange} required /></label>
            <input name="location" value={claimDetails.location} onChange={handleDetailChange} placeholder="Incident Location (City/Highway)" required />
            <textarea name="claimReason" value={claimDetails.claimReason} onChange={handleDetailChange} placeholder="Reason for Claim (e.g., Self-accident, Rear-ended)" required />
            <textarea name="incidentDescription" value={claimDetails.incidentDescription} onChange={handleDetailChange} placeholder="Brief Description of Incident" required />
          </fieldset>
          <fieldset>
            <legend>👤 Owner Details</legend>
            <input name="firstName" value={claimDetails.firstName} onChange={handleDetailChange} placeholder="First Name" required />
            <input name="lastName" value={claimDetails.lastName} onChange={handleDetailChange} placeholder="Last Name" required />
            <input name="mobileNumber" value={claimDetails.mobileNumber} onChange={handleDetailChange} placeholder="Mobile Number" required />
            <input name="email" type="email" value={claimDetails.email} onChange={handleDetailChange} placeholder="Email Address" required />
            <input name="aadharNumber" value={claimDetails.aadharNumber} onChange={handleDetailChange} placeholder="Aadhaar Number" required />
            <input name="drivingLicenseNumber" value={claimDetails.drivingLicenseNumber} onChange={handleDetailChange} placeholder="Driving License Number (optional)" />
            <textarea name="address" value={claimDetails.address} onChange={handleDetailChange} placeholder="Address" required />
          </fieldset>
          <fieldset>
            <legend>📄 Insurance Information</legend>
            <input name="insuranceCompany" value={claimDetails.insuranceCompany} onChange={handleDetailChange} placeholder="Insurance Company Name" />
            <input name="policyNumber" value={claimDetails.policyNumber} onChange={handleDetailChange} placeholder="Policy Number" />
            <label>Policy Expiry Date: <input name="policyExpiryDate" type="date" value={claimDetails.policyExpiryDate} onChange={handleDetailChange} /></label>
            <input name="claimNumber" value={claimDetails.claimNumber} onChange={handleDetailChange} placeholder="Claim Number (if already filed)" />
            <label><input name="isFirFiled" type="checkbox" checked={claimDetails.isFirFiled} onChange={handleDetailChange} /> Is FIR Filed?</label>
            {claimDetails.isFirFiled && (<input name="firNumber" value={claimDetails.firNumber} onChange={handleDetailChange} placeholder="FIR Number" />)}
            <input name="insuredDeclaredValue" type="number" value={claimDetails.insuredDeclaredValue} onChange={handleDetailChange} placeholder="Insured Declared Value (IDV) e.g., 500000" required />
            <div className="toggle-container" style={{ gridColumn: "1 / -1", background: "#e3f2fd", padding: "15px", borderRadius: "10px", display: "flex", alignItems: "center", gap: "15px" }}>
              <label className="switch" style={{ position: "relative", display: "inline-block", width: "50px", height: "26px" }}>
                <input type="checkbox" name="hasZeroDepreciationCover" checked={claimDetails.hasZeroDepreciationCover} onChange={handleDetailChange} style={{ opacity: 0, width: 0, height: 0 }} />
                <span className="slider round" style={{ position: "absolute", cursor: "pointer", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: claimDetails.hasZeroDepreciationCover ? "#2196f3" : "#ccc", borderRadius: "34px", transition: ".4s" }}>
                  <span style={{ position: "absolute", content: '""', height: "18px", width: "18px", left: claimDetails.hasZeroDepreciationCover ? "26px" : "4px", bottom: "4px", backgroundColor: "white", borderRadius: "50%", transition: ".4s" }}></span>
                </span>
              </label>
              <span style={{ fontWeight: "bold", color: "#0d47a1" }}>🛡️ Enable Zero Depreciation Cover? (Get 100% on Parts)</span>
            </div>
          </fieldset>
          <fieldset>
            <legend>🛠️ Repair Preferences</legend>
            <input name="preferredGarage" value={claimDetails.preferredGarage} onChange={handleDetailChange} placeholder="Preferred Garage/Service Center" />
            <label><input name="needsPickup" type="checkbox" checked={claimDetails.needsPickup} onChange={handleDetailChange} /> Need Pickup Service?</label>
            <label>Urgency: <select name="urgency" value={claimDetails.urgency} onChange={handleDetailChange}><option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option></select></label>
            <input name="budgetEstimate" type="number" value={claimDetails.budgetEstimate} onChange={handleDetailChange} placeholder="Budget Estimate (if any)" />
          </fieldset>
          {error && <div className="error-message">{error}</div>}
          <button type="submit" disabled={isLoading}>{isLoading ? "Saving..." : "Next: Upload Image"}</button>
        </form>
      ) : (
        <div className="upload-form">
          <h2>Step 2: Upload Damaged Vehicle Image (Claim #{nextClaimDisplayId})</h2>
          <form onSubmit={handleImageSubmit} className="upload-container">
            <input type="file" id="fileUpload" style={{ display: "none" }} onChange={handleFileChange} accept="image/png, image/jpeg, image/jpg" />
            <label htmlFor="fileUpload" className="file-drop-zone">
              <div className="file-drop-zone-text">
                <UploadIcon />
                <span>{selectedFile ? "Image Ready for Upload!" : "Click to browse or drag & drop image"}</span>
              </div>
            </label>
            {selectedFile && <div className="file-name-preview">Selected File: {selectedFile.name}</div>}
            {error && <p className="error-message">{error}</p>}
            <button type="submit" className="estimate-button" disabled={!selectedFile || isLoading}>{isLoading ? "Analyzing..." : "Get Estimate"}</button>
          </form>
          {renderResults()}
        </div>
      )}
    </div>
  );
}

export default HomePage;
