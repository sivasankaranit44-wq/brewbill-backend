const mongoose = require('mongoose');

const clientSchema = mongoose.Schema({
    user:{type:mongoose.Schema.Types.ObjectId, required:true, ref:"User"},
    name:{type:String, required:true},
    email:{type:String, required:true},
    phone:{type:String, required:true},
    company:{type:String, required:true},
    address:{type:String, required:true},
    gstin:{type:String, required:true},
},{timestamps:true});

module.exports = mongoose.model('Client', clientSchema);