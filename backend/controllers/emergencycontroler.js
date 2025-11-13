const Emergency = require("../models/emergency");
const User = require("../models/user");
const Notification = require("../models/notification");
const mongoose = require("mongoose");
const axios = require("axios");
const https = require("https");

let io = null;
try {
  io = require('../socket').io;
} catch (e) {
  io = global.io || null;
}

// ✅ Helper response functions
function successResponse(res, data, message = "Success", status = 200) {
  return res.status(status).json({
    success: true,
    message,
    data,
  });
}

function errorResponse(res, message = "Error", status = 500, error = null) {
  return res.status(status).json({
    success: false,
    message,
    error: error?.message || null,
  });
}

// ✅ Socket emitters
const emitToUser = (userId, event, data) => {
  if (io) io.to(`user:${userId}`).emit(event, data);
};

const emitToEmergency = (emergencyId, event, data) => {
  if (io) io.to(`emergency:${emergencyId}`).emit(event, data);
};

const emitToAll = (event, data) => {
  if (io) io.emit(event, data);
};

// ✅ Event constants
const EVENTS = {
  NEW_EMERGENCY: "newEmergency",
  EMERGENCY_CREATED: "emergencyCreated",
  RESPONDER_ADDED: "responderAdded",
  RESPONDER_UPDATED: "responderUpdated",
  EMERGENCY_STATUS_UPDATED: "emergencyStatusUpdated",
  EMERGENCY_RESOLVED: "emergencyResolved",
};

// ✅ Dummy push notification sender
const sendPushNotification = async (tokens, title, message, data) => {
  try {
    console.log(`📬 Sending push notification: ${title} - ${message}`);
    return { success: true, sentCount: tokens.length };
  } catch (error) {
    console.error("Error sending push notification:", error);
    return { success: false, error: error.message };
  }
};

// ✅ Fallback for address generation
const generateBasicAddress = (latitude, longitude) => {
  return `Location: ${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E`;
};

// ✅ Reverse Geocoding with timeout, IPv4, and fallback
const getAddressFromCoordinates = async (latitude, longitude) => {
  console.log(`[INFO] Reverse geocoding coordinates: ${latitude}, ${longitude}`);
  
  const basicAddress = generateBasicAddress(latitude, longitude);
  const agent = new https.Agent({ family: 4 }); // Force IPv4

  try {
    const response = await axios.get(
      "https://nominatim.openstreetmap.org/reverse",
      {
        params: {
          format: "json",
          lat: latitude,
          lon: longitude,
          zoom: 18,
          addressdetails: 1,
        },
        timeout: 5000, // 5 seconds timeout
        httpsAgent: agent,
        headers: {
          "User-Agent": "HelpNet/1.0 (contact@helpnet.com)",
          "Accept": "application/json",
        },
      }
    );

    if (response.data?.display_name) {
      console.log(`[INFO] Geocoding successful: ${response.data.display_name}`);
      return response.data.display_name;
    } else {
      console.warn("[WARN] Geocoding returned no address, using fallback.");
      return basicAddress;
    }
  } catch (error) {
    console.error(`[ERROR] Geocoding failed: ${error.code || error.message}`);
    return basicAddress;
  }
};

// ✅ Create Emergency
const createEmergency = async (req, res) => {
  try {
    let { emergencyType, description, longitude, latitude, address } = req.body;
    const userId = req.user._id;

    // Basic validation
    if (!emergencyType || !description || !longitude || !latitude) {
      return errorResponse(res, "Missing required fields", 400);
    }

    longitude = parseFloat(longitude);
    latitude = parseFloat(latitude);

    if (isNaN(longitude) || isNaN(latitude)) {
      return errorResponse(res, "Invalid coordinates", 400);
    }

    // Get address (with fallback)
    if (!address || address.trim() === "") {
      address = await getAddressFromCoordinates(latitude, longitude);
    }

    // Create emergency document
    const emergency = new Emergency({
      createdBy: userId,
      emergencyType,
      description,
      location: {
        type: "Point",
        coordinates: [longitude, latitude],
        address,
      },
      status: "active",
    });

    await emergency.save();

    // Find nearby users
    const nearbyUsers = await User.find({
      _id: { $ne: userId },
      availabilityStatus: true,
      "currentLocation.lastUpdated": {
        $gte: new Date(Date.now() - 30 * 60 * 1000), // last 30 minutes
      },
      "currentLocation.coordinates": {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [longitude, latitude],
          },
          $maxDistance: 5000, // 5 km
        },
      },
    }).select("_id name pushTokens");

    // Create notifications
    const notifications = nearbyUsers.map((user) => ({
      userId: user._id,
      emergencyId: emergency._id,
      type: "emergency_alert",
      title: `${emergencyType.toUpperCase()} EMERGENCY NEARBY`,
      message: `Someone needs help with a ${emergencyType} emergency near ${address}. Can you respond?`,
    }));

    if (notifications.length > 0) await Notification.insertMany(notifications);

    // Send push notifications
    const pushPromises = nearbyUsers.map((user) => {
      if (user.pushTokens?.length > 0) {
        const tokens = user.pushTokens.map((t) => t.token);
        const note = notifications.find(
          (n) => n.userId.toString() === user._id.toString()
        );
        return sendPushNotification(
          tokens,
          note.title,
          note.message,
          { emergencyId: emergency._id.toString(), type: "emergency_alert" }
        );
      }
      return Promise.resolve();
    });

    await Promise.all(pushPromises);

    // Socket notifications
    nearbyUsers.forEach((user) => {
      emitToUser(user._id, EVENTS.NEW_EMERGENCY, {
        emergency: {
          _id: emergency._id,
          emergencyType: emergency.emergencyType,
          description: emergency.description,
          location: emergency.location,
          createdAt: emergency.createdAt,
        },
      });
    });

    emitToAll(EVENTS.EMERGENCY_CREATED, {
      emergencyId: emergency._id,
      emergencyType: emergency.emergencyType,
      createdBy: emergency.createdBy,
      location: emergency.location,
    });

    return successResponse(
      res,
      { emergency, notifiedUsers: nearbyUsers.length },
      "Emergency created and nearby users notified",
      201
    );
  } catch (error) {
    console.error("❌ Error creating emergency:", error);
    return errorResponse(res, "Failed to create emergency", 500, error);
  }
};

// ✅ Get Active Emergencies
const getActiveEmergencies = async (req, res) => {
  try {
    const emergencies = await Emergency.find({
      status: { $in: ["active", "responding"] },
    })
      .populate("createdBy", "name")
      .sort({ createdAt: -1 });

    return successResponse(res, emergencies, "Active emergencies retrieved");
  } catch (error) {
    console.error("Error retrieving active emergencies:", error);
    return errorResponse(res, "Failed to retrieve emergencies", 500, error);
  }
};

// ✅ Get Emergency Details
const getEmergency = async (req, res) => {
  try {
    const { emergencyId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(emergencyId)) {
      return errorResponse(res, "Invalid emergency ID", 400);
    }

    const emergency = await Emergency.findById(emergencyId)
      .populate("createdBy", "name")
      .populate("responders.userId", "name phone currentLocation");

    if (!emergency) return errorResponse(res, "Emergency not found", 404);

    return successResponse(res, emergency, "Emergency details retrieved");
  } catch (error) {
    console.error("Error retrieving emergency details:", error);
    return errorResponse(res, "Failed to retrieve emergency details", 500, error);
  }
};

// ✅ Respond to Emergency
const respondToEmergency = async (req, res) => {
  try {
    const { emergencyId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(emergencyId)) {
      return errorResponse(res, "Invalid emergency ID", 400);
    }

    const emergency = await Emergency.findById(emergencyId);
    if (!emergency) return errorResponse(res, "Emergency not found", 404);

    if (["resolved", "cancelled"].includes(emergency.status)) {
      return errorResponse(res, "Emergency already resolved/cancelled", 400);
    }

    // Manage responder
    let responder = emergency.responders.find(
      (r) => r.userId.toString() === userId
    );

    if (responder) {
      if (responder.status === "notified") {
        responder.status = "en_route";
        responder.respondedAt = Date.now();
      } else if (responder.status === "en_route") {
        responder.status = "on_scene";
        responder.arrivedAt = Date.now();
      } else if (responder.status === "on_scene") {
        responder.status = "completed";
        responder.completedAt = Date.now();
      }
    } else {
      emergency.responders.push({
        userId,
        status: "en_route",
        notifiedAt: Date.now(),
        respondedAt: Date.now(),
      });
    }

    if (emergency.status === "active" && emergency.responders.length > 0) {
      emergency.status = "responding";
    }

    await emergency.save();

    emitToUser(emergency.createdBy, EVENTS.RESPONDER_ADDED, {
      emergencyId: emergency._id,
      responder: { _id: userId, status: responder ? responder.status : "en_route" },
    });

    emitToEmergency(emergencyId, EVENTS.RESPONDER_UPDATED, {
      emergencyId: emergency._id,
      responder: { _id: userId, status: responder ? responder.status : "en_route" },
    });

    return successResponse(res, { emergency }, "Response recorded successfully");
  } catch (error) {
    console.error("Error responding to emergency:", error);
    return errorResponse(res, "Failed to respond to emergency", 500, error);
  }
};

// ✅ Update Emergency Status
const updateEmergencyStatus = async (req, res) => {
  try {
    const { emergencyId } = req.params;
    const { status } = req.body;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(emergencyId)) {
      return errorResponse(res, "Invalid emergency ID", 400);
    }

    if (!status || !["active", "responding", "resolved", "cancelled"].includes(status)) {
      return errorResponse(res, "Invalid status", 400);
    }

    const emergency = await Emergency.findById(emergencyId);
    if (!emergency) return errorResponse(res, "Emergency not found", 404);

    const isCreator = emergency.createdBy.toString() === userId;
    const isResponder = emergency.responders.some(
      (responder) =>
        responder.userId.toString() === userId &&
        ["en_route", "on_scene"].includes(responder.status)
    );

    if (!isCreator && !isResponder) {
      return errorResponse(res, "Not authorized to update this emergency", 403);
    }

    emergency.status = status;
    if (status === "resolved") emergency.resolvedAt = Date.now();

    await emergency.save();

    emitToEmergency(emergencyId, EVENTS.EMERGENCY_STATUS_UPDATED, {
      emergencyId: emergency._id,
      status: emergency.status,
      updatedBy: userId,
    });

    if (status === "resolved") {
      emitToAll(EVENTS.EMERGENCY_RESOLVED, { emergencyId: emergency._id });
    }

    return successResponse(res, { emergency }, "Emergency status updated successfully");
  } catch (error) {
    console.error("Error updating emergency status:", error);
    return errorResponse(res, "Failed to update emergency status", 500, error);
  }
};

// ✅ Export all
module.exports = {
  createEmergency,
  getActiveEmergencies,
  getEmergency,
  respondToEmergency,
  updateEmergencyStatus,
};
