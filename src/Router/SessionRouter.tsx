import React from 'react';
import { Login } from '../Components/Auth';
import { useRoutes } from 'hookrouter';

const routes = {
    '/': () => <Login/>,
    '/login': () => <Login/>,
};

const SessionRouter = () => {
    const content = useRoutes(routes) || <Login/>;
    return <div>
        <div className="w3-padding">
            {content}
        </div>

    </div>

};

export default SessionRouter;
