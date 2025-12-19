// Script to update William Saliba's role from Job Candidate to Employee
const { MongoClient, ObjectId } = require('mongodb');

const uri = 'mongodb+srv://Team3:SWProject1Team3@cluster0.4mleald.mongodb.net/FullProject?appName=Cluster0';

async function updateRole() {
    const client = new MongoClient(uri);

    try {
        await client.connect();
        console.log('Connected to MongoDB');

        const db = client.db('FullProject');

        // Update William Saliba's role from Job Candidate to Employee
        const result = await db.collection('employee_system_roles').updateOne(
            { _id: new ObjectId('6944ffd16b04511d537fcbc0') },
            { $set: { roles: ['Employee'] } }
        );

        console.log('Update result:', result);

        // Verify the update
        const updated = await db.collection('employee_system_roles').findOne(
            { _id: new ObjectId('6944ffd16b04511d537fcbc0') }
        );
        console.log('Updated record:', updated);

    } finally {
        await client.close();
        console.log('Connection closed');
    }
}

updateRole().catch(console.error);
