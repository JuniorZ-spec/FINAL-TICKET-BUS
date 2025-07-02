import { Form, Modal, Row, Col, message, Input } from 'antd';
import { HideLoading, ShowLoading } from '../redux/alertsSlice';
import { useDispatch } from 'react-redux';
import { axiosInstance } from '../helpers/axiosInstance';

function StationForm({ showStationForm, setShowStationForm, type = "add", getData, selectedStation, setSelectedStation }) {
  const dispatch = useDispatch();

  const onFinish = async (values) => {
    try {
      dispatch(ShowLoading());

      let response = null;

      if (type === "add") {
        response = await axiosInstance.post('/api/stations/add-station', values);
      } else {
        response = await axiosInstance.put(`/api/stations/update-station/${selectedStation._id}`, values);
      }

      dispatch(HideLoading());

      if (response.data.success) {
        message.success(response.data.message);
        getData();
        setShowStationForm(false);
        setSelectedStation(null);
      } else {
        message.error(response.data.message);
      }
    } catch (error) {
      dispatch(HideLoading());
      message.error(error.response?.data?.message || "Erreur lors de la sauvegarde de la station");
    }
  };

  return (
    <Modal
      width={600}
      title={type === "add" ? "Ajouter une Station" : "Mettre à jour la Station"}
      open={showStationForm}
      onCancel={() => {
        setSelectedStation(null);
        setShowStationForm(false);
      }}
      footer={false}
    >
      <Form
        layout="vertical"
        onFinish={onFinish}
        initialValues={selectedStation || {}}
      >
        <Row gutter={[10, 10]}>
          <Col lg={24} xs={24}>
            <Form.Item label="Nom de la station" name="name" rules={[{ required: true, message: "Veuillez entrer le nom de la station" }]}>
              <Input placeholder="Entrez le nom de la station" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={[10, 10]}>
          <Col lg={24} xs={24}>
            <Form.Item label="Adresse" name="address" rules={[{ required: true, message: "Veuillez entrer l'adresse de la station" }]}>
              <Input placeholder="Entrez l'adresse de la station" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={[10, 10]}>
          <Col lg={24} xs={24}>
            <Form.Item label="Ville" name="city" rules={[{ required: true, message: "Veuillez entrer la ville" }]}>
              <Input placeholder="Entrez la ville" />
            </Form.Item>
          </Col>
        </Row>

        <div className="flex justify-end gap-2">
          <button type="button"  className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300 transition"
 onClick={() => setShowStationForm(false)}>
            Annuler
          </button>
          <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition" type="submit">
            Sauvegarder
          </button>
        </div>
      </Form>
    </Modal>
  );
}

export default StationForm;
