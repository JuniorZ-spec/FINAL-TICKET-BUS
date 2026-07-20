import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import store from "./redux/store";
import { Provider } from "react-redux";
import { ConfigProvider } from "antd";

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
