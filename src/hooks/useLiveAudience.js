"use client";

import { useEffect, useState } from "react";

const countPresence = (state) =>
  Object.values(state).reduce((total, entries) => total + entries.length, 0);

export function useLiveAudience({ client, user, teacher, student, teacherName }) {
  const [studentsOnline, setStudentsOnline] = useState(0);
  const [teachersOnline, setTeachersOnline] = useState([]);

  useEffect(() => {
    if (!client) return undefined;
    const channels = [];
    const setup = async () => {
    if (teacher && user) await client.realtime.setAuth();
    const studentChannel = client.channel("presence:students", {
      config: { presence: { key: `student-${crypto.randomUUID()}` } },
    });
    const updateStudents = () => setStudentsOnline(countPresence(studentChannel.presenceState()));
    studentChannel
      .on("presence", { event: "sync" }, updateStudents)
      .on("presence", { event: "join" }, updateStudents)
      .on("presence", { event: "leave" }, updateStudents)
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED" && student) await studentChannel.track({ role: "student" });
      });
    channels.push(studentChannel);

    if (teacher && user) {
      const teacherChannel = client.channel("presence:teachers", {
        config: { private: true, presence: { key: user.id } },
      });
      const updateTeachers = () => {
        const unique = new Map();
        Object.values(teacherChannel.presenceState()).flat().forEach((entry) => {
          if (!unique.has(entry.id)) unique.set(entry.id, entry);
        });
        setTeachersOnline([...unique.values()].map((entry) => ({ id: entry.id, name: entry.name || "Teacher" })));
      };
      teacherChannel
        .on("presence", { event: "sync" }, updateTeachers)
        .on("presence", { event: "join" }, updateTeachers)
        .on("presence", { event: "leave" }, updateTeachers)
        .subscribe(async (status) => {
          if (status !== "SUBSCRIBED") return;
            await teacherChannel.track({ id: user.id, name: teacherName || user.user_metadata?.full_name || user.email, role: "teacher" });
        });
      channels.push(teacherChannel);
    }
    };
    setup();
    return () => channels.forEach((channel) => client.removeChannel(channel));
  }, [client, user, teacher, student, teacherName]);

  return { studentsOnline, teachersOnline };
}
