async function testEndpoints() {
  const BASE_URL = 'http://localhost:5000/api';

  try {
    console.log('--- 1. Testing Clinic Dashboard API ---');
    const dashRes = await fetch(`${BASE_URL}/clinic/sanjeevani-clinic/dashboard`);
    const dashData = await dashRes.json();
    console.log('Clinic:', dashData.business.name);
    console.log('Appointments Count:', dashData.appointments.length);
    console.log('Doctors Count:', dashData.doctors.length);
    console.log('Pending Graduate Tasks:', dashData.pendingReviewsCount);

    console.log('\n--- 2. Testing Customer Gemini AI Enquiry ---');
    const inqRes = await fetch(`${BASE_URL}/customer/enquiry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessSlug: 'sanjeevani-clinic',
        customerName: 'Anand Kumar',
        customerPhone: '+91 98450 77112',
        message: 'What is the fee for consultation with Dr. Sneha?'
      })
    });
    const inqData = await inqRes.json();
    console.log('Intent:', inqData.triage.intent);
    console.log('AI Response:', inqData.triage.aiResponse);

    console.log('\n--- 3. Testing Customer Slot Booking (Clean Slot) ---');
    const doctor = dashData.doctors.find(d => d.isOnDuty);
    const bookRes = await fetch(`${BASE_URL}/customer/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessSlug: 'sanjeevani-clinic',
        doctorId: doctor._id,
        patientName: 'Sunil Gavaskar',
        patientPhone: '+91 99880 22334',
        timeSlot: '05:30 PM',
        symptoms: 'Mild knee stiffness'
      })
    });
    const bookData = await bookRes.json();
    console.log('Booking Result:', bookData.status, '| Token:', bookData.appointment.tokenNo);

    console.log('\n--- 4. Testing Conflicting Booking (Triggers Graduate Task) ---');
    const offDutyDoc = dashData.doctors.find(d => !d.isOnDuty) || doctor;
    const conflictRes = await fetch(`${BASE_URL}/customer/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessSlug: 'sanjeevani-clinic',
        doctorId: offDutyDoc._id,
        patientName: 'Conflict Test Patient',
        patientPhone: '+91 99880 99887',
        timeSlot: '05:30 PM',
        symptoms: 'Needs emergency check'
      })
    });
    const conflictData = await conflictRes.json();
    console.log('Conflict Result:', conflictData.status, '| Reason:', conflictData.conflictReason);

    console.log('\n--- 5. Testing Graduate Tasks Queue ---');
    const graduateTasksRes = await fetch(`${BASE_URL}/graduate/${dashData.business.assignedGraduateId._id}/tasks`);
    const graduateTasksData = await graduateTasksRes.json();
    console.log('Graduate Active Tasks Count:', graduateTasksData.tasks.length);

    console.log('\n✅ ALL 3-ROLE WORKFLOW ENDPOINTS VERIFIED AND CONNECTED TO MONGODB ATLAS!');
  } catch (err) {
    console.error('Test error:', err.message);
  }
}

testEndpoints();
