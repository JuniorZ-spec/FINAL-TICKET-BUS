import { Form, Modal, Row, Col, message, Input } from "antd";
import { HideLoading, ShowLoading } from "../redux/alertsSlice";
import { useDispatch } from "react-redux";
import { axiosInstance } from "../helpers/axiosInstance";
import { Building2, MapPin, Landmark } from "lucide-react";

const iconProps = { size: 15, className: "text-anthracite/30" };

function StationForm({
  showStationForm,
  setShowStationForm,
  type = "add",
  getData,
  selectedStation,
  setSelectedStation,
}) {
  const dispatch = useDispatch();

  const onFinish = async (values) => {
    try {
      dispatch(ShowLoading());

      let response = null;

      if (type === "add") {
        response = await axiosInstance.post("/api/stations/add-station", values);
      } else {
        response = await axiosInstance.put(
          `/api/stations/update-station/${selectedStation.id}`,
          values
        );
      }

      if (response.data.success) {
        message.success(response.data.message);
        getData();
        setShowStationForm(false);
        setSelectedStation(null);
      } else {
        message.error(response.data.message);
      }
    } catch (error) {
      message.error(error.response?.data?.message || "Erreur lors de la sauvegarde de la station");
    } finally {
      dispatch(HideLoading());
    }
  };

  return (
    <Modal
      width={600}
      title={type === "add" ? "Ajouter une gare" : "Modifier la gare"}
      open={showStationForm}
      onCancel={() => {
        setSelectedStation(null);
        setShowStationForm(false);
      }}
      footer={false}
    >
      <Form layout="vertical" onFinish={onFinish} initialValues={selectedStation || {}}>
        <Row gutter={[10, 10]}>
          <Col lg={24} xs={24}>
            <Form.Item
              label="Nom de la gare"
              name="name"
              rules={[{ required: true, message: "Veuillez entrer le nom de la gare" }]}
            >
              <Input
                prefix={<Landmark {...iconProps} />}
                placeholder="Ex : Gare routière de Cotonou"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={[10, 10]}>
          <Col lg={24} xs={24}>
            <Form.Item
              label="Adresse"
              name="address"
              rules={[{ required: true, message: "Veuillez entrer l'adresse de la gare" }]}
            >
              <Input prefix={<MapPin {...iconProps} />} placeholder="Ex : Etoile Rouge, Cotonou" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={[10, 10]}>
          <Col lg={24} xs={24}>
            <Form.Item
              label="Ville"
              name="city"
              rules={[{ required: true, message: "Veuillez entrer la ville" }]}
            >
              <Input prefix={<Building2 {...iconProps} />} placeholder="Ex : Cotonou" />
            </Form.Item>
          </Col>
        </Row>

        <div className="flex justify-end gap-2 mt-2">
          <button
            type="button"
            className="bg-gray-100 text-anthracite/70 px-6 py-2 rounded-lg hover:bg-gray-200 transition"
            onClick={() => setShowStationForm(false)}
          >
            Annuler
          </button>
          <button
            className="bg-terracotta text-white px-6 py-2 rounded-lg hover:bg-terracotta-dark transition"
            type="submit"
          >
            Sauvegarder
          </button>
        </div>
      </Form>
    </Modal>
  );
}

export default StationForm;
