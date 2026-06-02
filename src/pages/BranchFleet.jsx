import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getBranchHeadProfile, getBranchCars } from "../api.js";
import { carImageUrl } from "../utils/carImage.js";
import { formatINR } from "../utils/formatters.js";
import "./BranchFleet.css";

export default function BranchFleet() {
  const navigate = useNavigate();
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [branchId, setBranchId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCar, setSelectedCar] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const CARS_PER_PAGE = 12;

  // Load profile to get branchId
  useEffect(() => {
    getBranchHeadProfile()
      .then((prof) => setBranchId(prof?.branch_id))
      .catch(() => setLoading(false));
  }, []);

  const loadCars = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getBranchCars(branchId);
      setCars(Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []);
    } catch (err) {
      setError(err.message || "Failed to load cars");
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => { loadCars(); }, [loadCars]);

  const filtered = cars.filter((c) =>
    !searchTerm ||
    c.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.licensePlate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / CARS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * CARS_PER_PAGE, currentPage * CARS_PER_PAGE);

  const getStatusInfo = (car) => {
    if (car.approvalstatus === "pending") return { cls: "status-pending", label: "Pending Approval" };
    if (car.approvalstatus === "rejected") return { cls: "status-rejected", label: "Rejected" };
    if (!car.isAvailable) return { cls: "status-unavailable", label: "Unavailable" };
    return { cls: "status-approved", label: "Available" };
  };

  const stats = {
    total: cars.length,
    available: cars.filter((c) => c.isAvailable && c.approvalstatus === "approved").length,
    pending: cars.filter((c) => c.approvalstatus === "pending").length,
    unavailable: cars.filter((c) => !c.isAvailable).length,
  };

  return (
    <div className="branch-fleet-container">
      <div className="fleet-header">
        <button type="button" className="fleet-back-btn" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <div className="fleet-header-title">
          <h1>Fleet Management</h1>
        </div>
        <Link to="/car-register" className="add-car-btn">+ Add New Car</Link>
      </div>

      <div className="fleet-stats">
        {[
          { label: "Total Cars", value: stats.total, cls: "" },
          { label: "Available", value: stats.available, cls: "success" },
          { label: "Pending", value: stats.pending, cls: "warning" },
          { label: "Unavailable", value: stats.unavailable, cls: "danger" },
        ].map((s) => (
          <div key={s.label} className={`stat-card ${s.cls}`}>
            <div className="stat-info">
              <span className="stat-value">{s.value}</span>
              <span className="stat-label">{s.label}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="fleet-search">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by model, plate, or category..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          />
        </div>
        <button className="refresh-btn" onClick={loadCars}>↻ Refresh</button>
      </div>

      {loading && (
        <div className="loading-state">
          <div className="loading-spinner" />
          <p>Loading fleet...</p>
        </div>
      )}

      {error && !loading && (
        <div className="error-state">
          <p>{error}</p>
          <button className="retry-btn" onClick={loadCars}>Try Again</button>
        </div>
      )}

      {!loading && !error && (
        <>
          {filtered.length === 0 ? (
            <div className="empty-state">
              <p>No cars found</p>
              <Link to="/car-register" className="add-car-btn">Add First Car</Link>
            </div>
          ) : (
            <>
              <div className="cars-grid">
                {paginated.map((car) => {
                  const { cls, label } = getStatusInfo(car);
                  return (
                    <div key={car.id} className="car-card">
                      <div className="car-image-container">
                        <img
                          src={carImageUrl(car)}
                          alt={car.model}
                          className="car-image"
                          onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80"; }}
                        />
                        <span className={`car-status-badge ${cls}`}>{label}</span>
                      </div>
                      <div className="car-details">
                        <h3 className="car-model">{car.model}</h3>
                        <p className="car-year">{car.year}</p>
                        <div className="car-specs">
                          <span className="spec-tag">{car.fuelType}</span>
                          <span className="spec-tag">{car.transmission}</span>
                          <span className="spec-tag">{car.seatingCapacity} seats</span>
                        </div>
                        <div className="car-plate">
                          <span className="plate-label">Plate:</span>
                          <span className="plate-number">{car.licensePlate}</span>
                        </div>
                        <div className="car-pricing">
                          <div className="price-item"><span>6h</span><strong>{formatINR(car.six_hr_price)}</strong></div>
                          <div className="price-item"><span>12h</span><strong>{formatINR(car.twelve_hr_price)}</strong></div>
                          <div className="price-item"><span>24h</span><strong>{formatINR(car.twentyfour_hr_price)}</strong></div>
                        </div>
                        <div className="car-actions">
                          <button className="action-btn" onClick={() => setSelectedCar(car)}>View Details</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className="pagination">
                  <button className="page-btn" onClick={() => setCurrentPage((p) => p - 1)} disabled={currentPage === 1}>← Prev</button>
                  <span className="page-info">Page {currentPage} of {totalPages}</span>
                  <button className="page-btn" onClick={() => setCurrentPage((p) => p + 1)} disabled={currentPage === totalPages}>Next →</button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Car Detail Modal */}
      {selectedCar && (
        <div className="modal-overlay" onClick={() => setSelectedCar(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedCar.model} ({selectedCar.year})</h2>
              <button className="close-btn" onClick={() => setSelectedCar(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="modal-image">
                <img src={carImageUrl(selectedCar)} alt={selectedCar.model} onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80"; }} />
              </div>
              <div className="modal-details">
                {[
                  ["Model", selectedCar.model],
                  ["Year", selectedCar.year],
                  ["Category", selectedCar.category || "N/A"],
                  ["Transmission", selectedCar.transmission],
                  ["Fuel Type", selectedCar.fuelType],
                  ["Seats", selectedCar.seatingCapacity],
                  ["Color", selectedCar.colour || "N/A"],
                  ["License Plate", selectedCar.licensePlate],
                  ["Mileage", selectedCar.mileage ? `${selectedCar.mileage} km/l` : "N/A"],
                ].map(([label, value]) => (
                  <div key={label} className="detail-row">
                    <span className="detail-label">{label}:</span>
                    <span className="detail-value">{value}</span>
                  </div>
                ))}
                <div className="detail-section">
                  <span className="detail-label">Pricing:</span>
                  <div className="pricing-details">
                    <div>6h: <strong>{formatINR(selectedCar.six_hr_price)}</strong></div>
                    <div>12h: <strong>{formatINR(selectedCar.twelve_hr_price)}</strong></div>
                    <div>24h: <strong>{formatINR(selectedCar.twentyfour_hr_price)}</strong></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setSelectedCar(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
