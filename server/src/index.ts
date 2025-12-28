import httpServer from './app';

import 'dotenv/config';


async function startServer(){
    const port = process.env.PORT || 3000;
    httpServer.listen(port, () => {
        console.log(`Server is listening on port ${port}`);
    })
}
startServer()