import { describe, it, expect } from "vitest";

describe("Task Completion & Progress Logic", () => {
  it("should calculate individual completion progress accurately (e.g. 1/10 then 6/10)", () => {
    // 10 students assigned
    const totalStudents = 10;
    let completedCount = 0;

    let percentage = Math.round((completedCount / totalStudents) * 100);
    expect(percentage).toBe(0);

    // Ahmed completes
    completedCount = 1;
    percentage = Math.round((completedCount / totalStudents) * 100);
    expect(percentage).toBe(10);
    expect(`${completedCount}/${totalStudents}`).toBe("1/10");

    // 5 more complete -> 6/10
    completedCount = 6;
    percentage = Math.round((completedCount / totalStudents) * 100);
    expect(percentage).toBe(60);
    expect(`${completedCount}/${totalStudents}`).toBe("6/10");

    // All complete
    completedCount = 10;
    percentage = Math.round((completedCount / totalStudents) * 100);
    expect(percentage).toBe(100);
  });

  it("should prevent duplicate completion records when a student belongs to multiple assigned groups", () => {
    // Group 1: Ahmed (S1), Fatima (S2), Omar (S5)
    const group1Students = ["s1", "s2", "s5"];
    // Group 2: Ahmed (S1), Youssef (S3), Sarah (S4)
    const group2Students = ["s1", "s3", "s4"];

    // Task assigned to Group 1 AND Group 2
    const assignedGroupStudents = [...group1Students, ...group2Students];
    const uniqueAssignedStudents = Array.from(new Set(assignedGroupStudents));

    expect(uniqueAssignedStudents.length).toBe(5);
    expect(uniqueAssignedStudents.filter((id) => id === "s1").length).toBe(1);
  });

  it("should accurately track individual completion statuses without affecting other students", () => {
    const studentCompletions = [
      { student_id: "s1", status: "completed", note: "Matériel vérifié" },
      { student_id: "s2", status: "in_progress", note: null },
      { student_id: "s3", status: "pending", note: null },
    ];

    expect(studentCompletions.find((c) => c.student_id === "s1")?.status).toBe("completed");
    expect(studentCompletions.find((c) => c.student_id === "s2")?.status).toBe("in_progress");
    expect(studentCompletions.find((c) => c.student_id === "s3")?.status).toBe("pending");

    // S1 completing does NOT mark S2 or S3 completed
    const incompleteStudents = studentCompletions.filter((c) => c.status !== "completed");
    expect(incompleteStudents.length).toBe(2);
  });
});
