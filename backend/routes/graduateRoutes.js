const express = require('express');
const router = express.Router();

const GraduateTask = require('../models/GraduateTask');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');

/**
 * GET /api/graduate/:graduateId/tasks
 * Fetch all exception tasks for the assigned Graduate
 */
router.get('/:graduateId/tasks', async (req, res) => {
  try {
    const tasks = await GraduateTask.find({ graduateId: req.params.graduateId })
      .populate('businessId', 'name slug address phone')
      .populate('appointmentId')
      .sort({ createdAt: -1 });

    res.json({ tasks });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/graduate/tasks/:taskId/resolve
 * Graduate resolves an exception (reschedules slot, overrides, confirms)
 */
router.put('/tasks/:taskId/resolve', async (req, res) => {
  try {
    const { resolutionNote, updatedTimeSlot, updatedDoctorId } = req.body;

    const task = await GraduateTask.findById(req.params.taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    task.status = 'resolved';
    task.resolutionNote = resolutionNote || 'Resolved by OpsLoop Graduate specialist.';
    task.resolvedAt = new Date();
    await task.save();

    // If task was associated with an appointment, update appointment to confirmed!
    if (task.appointmentId) {
      const updateData = {
        status: 'confirmed',
        graduateResolutionNotes: task.resolutionNote,
        resolvedByGraduateId: task.graduateId
      };

      if (updatedTimeSlot) updateData.timeSlot = updatedTimeSlot;
      if (updatedDoctorId) {
        const doc = await Doctor.findById(updatedDoctorId);
        if (doc) {
          updateData.doctorId = doc._id;
          updateData.doctorName = doc.name;
        }
      }

      await Appointment.findByIdAndUpdate(task.appointmentId, updateData);
    }

    res.json({ success: true, message: 'Task resolved and customer record updated.', task });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
