import React from 'react';
import { Login } from '../Components/Auth';
import { useRoutes } from 'hookrouter';
import Header from "../Components/Common/Header";
import TopBar from "../Components/Common/TopBar";

const routes = {
    '/': () => <Login/>,
    '/login': () => <Login/>,
};

const SessionRouter = () => {
    const content = useRoutes(routes) || <Login/>;
    return <div>
<TopBar/>
        <div className="w3-padding">
            {content}
        </div>
        <div className="app-footer">
            <div className="copy-right">
                Corona Care Network
            </div>
        </div>
    </div>

};

export default SessionRouter;
