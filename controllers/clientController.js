const Client = require("../models/Client");

const getClients = async (req, res) => {
  try {
    const clients = await Client.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: clients });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getClientById = async (req, res) => {
  try {
    const client = await Client.findOne({ _id: req.params.id, user: req.user._id });
    if (!client) return res.status(404).json({ message: "Client not found" });
    res.json({ success: true, data: client });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createClient = async (req, res) => {
  try {
    const client = await Client.create({ ...req.body, user: req.user._id });
    res.status(201).json({ success: true, data: client });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateClient = async (req, res) => {
  try {
    const client = await Client.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!client) return res.status(404).json({ message: "Client not found" });
    res.json({ success: true, data: client });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteClient = async (req, res) => {
  try {
    const client = await Client.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!client) return res.status(404).json({ message: "Client not found" });
    res.json({ success: true, message: "Client deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getClients, getClientById, createClient, updateClient, deleteClient };