import { Form, Modal, Row, Col, message, Input, Checkbox } from "antd";
import { ShowLoading, HideLoading } from "../redux/alertsSlice";
import { useDispatch } from "react-redux";
import { axiosInstance } from "../helpers/axiosInstance";
import { useEffect } from "react";
import { Bus, Hash, Users } from "lucide-react";

const iconProps = { size: 15, className: "text-anthracite/30" };

function BusForm({
  showBusForm,
  setShowBusForm,
  type = "add",
  getData,
  selectedBus,
  setSelectedBus,
}) {
  const dispatch = useDispatch();
  const [form] = Form.useForm();

  useEffect(() => {
    if (selectedBus) {
      form.setFieldsValue({
        ...selectedBus,
        services: {
          airConditioning: selectedBus.airConditioning ?? false,
          wifi: selectedBus.wifi ?? false,
        },
      });
    }
  }, [selectedBus, form]);

  const onFinish = async (values) => {
    try {
      dispatch(ShowLoading());

      let response = null;

      if (type === "add") {
        response = await axiosInstance.post("/api/buses/add-bus", values);
      } else {
        response = await axiosInstance.post("/api/buses/update-bus", {
          ...values,
          _id: selectedBus.id,
        });
      }

      if (response.data.success) {
        message.success(response.data.message);
      } else {
        message.error(response.data.message);
      }

      getData();
      setShowBusForm(false);
      setSelectedBus(null);
    } catch (error) {
      message.error(error.response?.data?.message || error.message);
    } finally {
      dispatch(HideLoading());
    }
  };

  const handleCancel = () => {
    setShowBusForm(false);
    setSelectedBus(null);
  };

  if (type === "update" && !selectedBus) {
    return null;
  }

  return (
    <Modal
      width={600}
      title={type === "add" ? "Ajouter un bus" : "Modifier le bus"}
      open={showBusForm}
      onCancel={handleCancel}
      footer={false}
    >
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Row gutter={[10, 10]}>
          <Col lg={24} xs={24}>
            <Form.Item label="Nom" name="name" rules={[{ required: true, message: "Requis" }]}>
              <Input prefix={<Bus {...iconProps} />} placeholder="Ex : Bus VIP 01" />
            </Form.Item>
          </Col>

          <Col lg={12} xs={24}>
            <Form.Item
              label="Numéro d'immatriculation"
              name="number"
              rules={[{ required: true, message: "Requis" }]}
            >
              <Input prefix={<Hash {...iconProps} />} placeholder="Ex : BJ 1234 AB" />
            </Form.Item>
          </Col>

          <Col lg={12} xs={24}>
            <Form.Item
              label="Capacité"
              name="capacity"
              rules={[{ required: true, message: "Requis" }]}
            >
              <Input prefix={<Users {...iconProps} />} type="number" placeholder="Ex : 50" />
            </Form.Item>
          </Col>

          <Col lg={12} xs={24}>
            <Form.Item name={["services", "airConditioning"]} valuePropName="checked">
              <Checkbox>Climatisation</Checkbox>
            </Form.Item>
          </Col>

          <Col lg={12} xs={24}>
            <Form.Item name={["services", "wifi"]} valuePropName="checked">
              <Checkbox>Wi-Fi</Checkbox>
            </Form.Item>
          </Col>
        </Row>

        <div className="flex justify-end gap-2 mt-2">
          <button
            type="button"
            className="bg-gray-100 text-anthracite/70 px-6 py-2 rounded-lg hover:bg-gray-200 transition"
            onClick={handleCancel}
          >
            Annuler
          </button>
          <button
            className="bg-terracotta text-white px-6 py-2 rounded-lg hover:bg-terracotta-dark transition"
            type="submit"
          >
            Enregistrer
          </button>
        </div>
      </Form>
    </Modal>
  );
}

export default BusForm;
