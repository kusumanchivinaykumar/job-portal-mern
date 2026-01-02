import mongoose from "mongoose";

const jobSchema = new mongoose.Schema({
    title: { type: String, required: true},
    description: { type: String, required: true},
    location: { type: String, required: true},
    category: { type: String, required: true},
    level: { type: String, required: true},
    salary: { type: Number, required: true},
    date: { type: Date, default: Date.now },
    visible: { type: Boolean, default: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
    applicants: [{
        user: { type: String, ref: 'User', required: true },
        resume: { type: String },
        status: { type: String, enum: ["Pending", "Accepted", "Rejected"], default: "Pending" },
        appliedAt: { type: Date, default: Date.now }
    }]
}, { timestamps: true })

const Job = mongoose.model("Job", jobSchema)

export default Job;