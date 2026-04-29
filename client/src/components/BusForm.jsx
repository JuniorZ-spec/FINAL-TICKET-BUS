import { Form, Modal, Row, Col, message, Input, Checkbox } from "antd";
import { ShowLoading, HideLoading } from "../redux/alertsSlice";
import { useDispatch } from "react-redux";
import { axiosInstance } from "../helpers/axiosInstance";
import { useEffect } from "react";

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
      dispatch(HideLoading());
    } catch (error) {
      message.error(error.message);
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
      title={type === "add" ? "Add Bus" : "Update Bus"}
      open={showBusForm}
      onCancel={handleCancel}
      footer={false}
    >
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Row gutter={[10, 10]}>
          <Col lg={24} xs={24}>
            <Form.Item label="Name" name="name" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </Col>

          <Col lg={12} xs={24}>
            <Form.Item label="Bus Number" name="number" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </Col>

          <Col lg={12} xs={24}>
            <Form.Item label="Capacity" name="capacity" rules={[{ required: true }]}>
              <Input type="number" />
            </Form.Item>
          </Col>

          {/* Services */}
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

        <div className="d-flex justify-content-end">
          <button
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
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
