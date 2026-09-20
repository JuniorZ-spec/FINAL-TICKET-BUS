import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import store from "./redux/store";
import { Provider } from "react-redux";
import { ConfigProvider, message } from "antd";

// Les messages antd sont centrés sur toute la largeur de l'écran par défaut
// (top: 8px), ce qui les fait chevaucher la nav du header (elle aussi centrée).
message.config({ top: 80 });

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <Provider store={store}>
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#D85A30",
          colorLink: "#D85A30",
          borderRadius: 10,
          fontFamily: "Poppins, sans-serif",
        },
      }}
    >
      <App />
    </ConfigProvider>
  </Provider>
);
