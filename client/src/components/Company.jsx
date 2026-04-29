import { Building } from "lucide-react";
import { useNavigate } from "react-router-dom";

function Company({ company }) {
  const navigate = useNavigate();

  const goToCompanyTrips = () => {
    navigate(`/company-trips/${company.id}`);
  };

  return (
    <div
      className="bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition cursor-pointer"
      onClick={goToCompanyTrips}
    >
      <div className="flex items-center space-x-4">
        <div className="bg-blue-100 p-3 rounded-full">
          <Building className="w-5 h-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-gray-800">{company.companyName}</h2>
          <p className="text-sm text-gray-600">Voir les trajets proposés →</p>
        </div>
      </div>
    </div>
  );
}

export default Company;
