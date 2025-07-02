import { Form, Modal, Row, Col, message, Input, Select, DatePicker } from 'antd';
import { HideLoading, ShowLoading } from '../redux/alertsSlice';
import { useDispatch } from 'react-redux';
import { axiosInstance } from '../helpers/axiosInstance';
import { useEffect, useState } from 'react';
import moment from 'moment';

function TripForm({ showTripForm, setShowTripForm, type = "add", getData, selectedTrip, setSelectedTrip }) {
  const dispatch = useDispatch();
  const [stations, setStations] = useState([]);
  const [buses, setBuses] = useState([]);

  // États pour stocker les villes entrées
  const [fromCity, setFromCity] = useState('');
  const [toCity, setToCity] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        dispatch(ShowLoading());
        const stationsResponse = await axiosInstance.get('/api/companys/get-company-stations');
        const busesResponse = await axiosInstance.post('/api/buses/get-buses-company');

        if (stationsResponse.data.success) {
          setStations(stationsResponse.data.data);
        } else {
          message.error("Échec du chargement des gares");
        }

        if (busesResponse.data.success) {
          setBuses(busesResponse.data.data);
        } else {
          message.error("Échec du chargement des bus");
        }
      } catch (error) {
        message.error("Erreur lors du chargement des données");
      } finally {
        dispatch(HideLoading());
      }
    };

    fetchData();
  }, []);

  const getDepartureStations = () => {
    return stations.filter(station => station.city?.toLowerCase() === fromCity.toLowerCase());
  };

  const getArrivalStations = () => {
    return stations.filter(station => station.city?.toLowerCase() === toCity.toLowerCase());
  };

  const onFinish = async (values) => {
    try {
      dispatch(ShowLoading());

      // Vérification et conversion correcte de la date
      const formattedDate = values.date ? values.date.toISOString() : null;



      const payload = {
        ...values,
        date: formattedDate,  // On envoie la date formatée
        departureTime: values.departureTime,
        price: values.price
      };

      let response;
      if (type === "add") {
        response = await axiosInstance.post('/api/trips/add-trip', payload);
      } else {
        response = await axiosInstance.put(`/api/trips/update-trip/${selectedTrip._id}`, payload);
      }

      if (response.data.success) {
        message.success(response.data.message);
        getData();
        setShowTripForm(false);
      }
    } catch (error) {
      message.error("Erreur lors de l'enregistrement");
      console.error("Erreur API:", {
        request: error.config?.data,
        response: error.response?.data
      });
    } finally {
      dispatch(HideLoading());
    }
  };

  return (
    <Modal
      width={600}
      title={type === "add" ? "Ajouter un Trajet" : "Mettre à jour le Trajet"}
      open={showTripForm}
      onCancel={() => {
        setSelectedTrip(null);
        setShowTripForm(false);
      }}
      footer={false}
    >
      <Form
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          ...selectedTrip,
          date: selectedTrip?.date ? moment(selectedTrip.date) : null, // Assurez-vous que la date est bien formatée
          departureStations: selectedTrip?.departureStations?.map(s => s._id) || [],
          arrivalStations: selectedTrip?.arrivalStations?.map(s => s._id) || []
        }}
      >
        <Row gutter={[10, 10]}>
          <Col lg={12} xs={24}>
            <Form.Item label="Ville de départ" name="from" rules={[{ required: true, message: 'Veuillez entrer la ville de départ' }]}>
              <Input
                placeholder="Entrez la ville de départ"
                onChange={(e) => setFromCity(e.target.value)}
              />
            </Form.Item>
          </Col>
          <Col lg={12} xs={24}>
            <Form.Item label="Ville d'arrivée" name="to" rules={[{ required: true, message: 'Veuillez entrer la ville d\'arrivée' }]}>
              <Input
                placeholder="Entrez la ville d'arrivée"
                onChange={(e) => setToCity(e.target.value)}
              />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={[10, 10]}>
          <Col lg={12} xs={24}>
            <Form.Item label="Stations de départ" name="departureStations" rules={[{ required: true, message: 'Veuillez sélectionner les stations de départ' }]}>
              <Select mode="multiple" placeholder="Sélectionner les stations de départ">
                {getDepartureStations().map((station) => (
                  <Select.Option key={station._id} value={station._id}>{station.name}</Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col lg={12} xs={24}>
            <Form.Item label="Stations d'arrivée" name="arrivalStations" rules={[{ required: true, message: 'Veuillez sélectionner les stations d\'arrivée' }]}>
              <Select mode="multiple" placeholder="Sélectionner les stations d'arrivée">
                {getArrivalStations().map((station) => (
                  <Select.Option key={station._id} value={station._id}>{station.name}</Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={[10, 10]}>
          <Col lg={12} xs={24}>
            <Form.Item label="Bus" name="bus" rules={[{ required: true, message: 'Veuillez sélectionner un bus' }]}>
              <Select placeholder="Sélectionner un bus">
                {buses.map((bus) => (
                  <Select.Option key={bus._id} value={bus._id}>{bus.name}</Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col lg={12} xs={24}>
            <Form.Item label="Date" name="date" rules={[{ required: true, message: 'Veuillez sélectionner une date' }]}>
              <DatePicker className="w-full" format="YYYY-MM-DD" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={[10, 10]}>
          <Col lg={12} xs={24}>
            <Form.Item label="Prix" name="price" rules={[{ required: true, message: 'Veuillez entrer le prix' }]}>
              <Input type="number" placeholder="Entrez le prix" />
            </Form.Item>
          </Col>
          <Col lg={12} xs={24}>
            <Form.Item label="Heure de départ" name="departureTime" rules={[{ required: true, message: 'Veuillez entrer l\'heure de départ' }]}>
              <Input placeholder="Entrez l'heure de départ (ex: 08:30)" />
            </Form.Item>
          </Col>
        </Row>

        <div className="flex justify-end gap-2">
          <button type="button"  className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-500 transition" onClick={() => setShowTripForm(false)}>Annuler</button>
          <button  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition" type="submit">Sauvegarder</button>
        </div>
      </Form>
    </Modal>
  );
}

export default TripForm;
