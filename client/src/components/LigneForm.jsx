import { Form, Modal, Row, Col, message, Input } from "antd";
import { HideLoading, ShowLoading } from "../redux/alertsSlice";
import { useDispatch } from "react-redux";
import { axiosInstance } from "../helpers/axiosInstance";

function LigneForm({ open, setOpen, type = "add", getData, selectedLigne, setSelectedLigne }) {
  const dispatch = useDispatch();

  const onFinish = async (values) => {
    try {
      dispatch(ShowLoading());
      let response;
      if (type === "add") {
        response = await axiosInstance.post("/api/companys/create-ligne", values);
      } else {
        response = await axiosInstance.put(
          `/api/companys/update-ligne/${selectedLigne.id}`,
          values
        );
      }

      if (response.data.success) {
        message.success(response.data.message);
        getData();
        setOpen(false);
        setSelectedLigne(null);
      } else {
        message.error(response.data.message);
      }
    } catch (error) {
      message.error(error.response?.data?.message || "Erreur lors de l'enregistrement");
    } finally {
      dispatch(HideLoading());
    }
  };

  return (
    <Modal
      width={520}
      title={type === "add" ? "Nouvelle ligne tarifaire" : "Modifier la ligne"}
      open={open}
      onCancel={() => {
        setSelectedLigne(null);
        setOpen(false);
      }}
      footer={false}
    >
      <Form layout="vertical" onFinish={onFinish} initialValues={selectedLigne || {}}>
        <Row gutter={[10, 10]}>
          <Col lg={12} xs={24}>
            <Form.Item
              label="Ville de départ"
              name="from"
              rules={[{ required: true, message: "Requis" }]}
            >
              <Input placeholder="Ex : Cotonou" />
            </Form.Item>
          </Col>
          <Col lg={12} xs={24}>
            <Form.Item
              label="Ville d'arrivée"
              name="to"
              rules={[{ required: true, message: "Requis" }]}
            >
              <Input placeholder="Ex : Parakou" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={[10, 10]}>
          <Col lg={12} xs={24}>
            <Form.Item
              label="Code de la ligne"
              name="code"
              rules={[{ required: true, message: "Requis" }]}
            >
              <Input placeholder="Ex : CTN-PKO" />
            </Form.Item>
          </Col>
          <Col lg={12} xs={24}>
            <Form.Item label="Durée">
              <Form.Item name="duration" noStyle>
                <Input placeholder="Ex : 8h00" />
              </Form.Item>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={[10, 10]}>
          <Col lg={12} xs={24}>
            <Form.Item
              label="Tarif Standard (FCFA)"
              name="standardPrice"
              rules={[{ required: true, message: "Requis" }]}
            >
              <Input type="number" placeholder="Ex : 8500" />
            </Form.Item>
          </Col>
          <Col lg={12} xs={24}>
            <Form.Item label="Tarif VIP (FCFA)" name="vipPrice">
              <Input type="number" placeholder="Ex : 12000 (optionnel)" />
            </Form.Item>
          </Col>
        </Row>

        <div className="flex justify-end gap-2 mt-2">
          <button
            type="button"
            className="bg-gray-100 text-anthracite/70 px-6 py-2 rounded-lg hover:bg-gray-200 transition"
            onClick={() => {
              setSelectedLigne(null);
              setOpen(false);
            }}
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

export default LigneForm;
