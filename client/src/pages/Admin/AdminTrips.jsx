import { ShowLoading, HideLoading } from "../../redux/alertsSlice";
import TripForm from "../../components/TripForm";
import PageTitle from "../../components/PageTitle";
import { useEffect, useState } from "react";
import { message, Table, Button } from "antd";
import { useDispatch } from "react-redux";
import { axiosInstance } from "../../helpers/axiosInstance";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";

function AdminTrips() {
  const dispatch = useDispatch();
  const [showTripForm, setShowTripForm] = useState(false);
  const [trips, setTrips] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);

  // Get all trips with associated buses
  const getTrips = async () => {
    try {
      dispatch(ShowLoading());
      const response = await axiosInstance.get("/api/trips/get-all-trips");
      dispatch(HideLoading());
      if (response.data.success) {
        setTrips(response.data.data);
      } else {
        message.error(response.data.message);
      }
    } catch (error) {
      dispatch(HideLoading());
      message.error(error.response?.data?.message || "An error occurred");
    }
  };

  // Delete a trip
  const deleteTrip = async (id) => {
    try {
      dispatch(ShowLoading());
      const response = await axiosInstance.delete(`/api/trips/delete-trip/${id}`);
      dispatch(HideLoading());
      if (response.data.success) {
        message.success(response.data.message);
        getTrips();
      } else {
        message.error(response.data.message);
      }
    } catch (error) {
      dispatch(HideLoading());
      message.error(error.response?.data?.message || "An error occurred");
    }
  };

  // Table columns
  const columns = [
    { title: "From", dataIndex: "from" },
    { title: "To", dataIndex: "to" },
    {
      title: "Number of Buses",
      dataIndex: "buses",
      render: (text, record) => (record.buses ? record.buses.length : 0),
    },
    {
      title: "Actions",
      dataIndex: "action",
      render: (_, record) => (
        <div className="flex gap-2">
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => {
              setSelectedTrip(record);
              setShowTripForm(true);
            }}
          />
          <Button type="danger" icon={<DeleteOutlined />} onClick={() => deleteTrip(record.id)} />
        </div>
      ),
    },
  ];

  useEffect(() => {
    getTrips();
  }, []);

  return (
    <div className="p-4 bg-white shadow rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <PageTitle title="Trip Management" />
        <Button type="primary" onClick={() => setShowTripForm(true)}>
          Add Trip
        </Button>
      </div>
      <Table columns={columns} dataSource={trips} rowKey="id" pagination={{ pageSize: 5 }} />
      {showTripForm && (
        <TripForm
          showTripForm={showTripForm}
          setShowTripForm={setShowTripForm}
          type={selectedTrip ? "edit" : "add"}
          getData={getTrips}
          selectedTrip={selectedTrip}
          setSelectedTrip={setSelectedTrip}
        />
      )}
    </div>
  );
}

export default AdminTrips;
