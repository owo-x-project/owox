import { render } from "solid-js/web";
import { ApiClient } from "./api/client";
import { WorkspaceShell } from "./features/shell/WorkspaceShell";
import "./styles.css";

const api = new ApiClient();

function App() {
  return <WorkspaceShell api={api} />;
}

render(() => <App />, document.getElementById("root") as HTMLElement);
