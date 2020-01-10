import React, { useState, useEffect } from "react";
import "rbx/index.css";
import { Button, Container, Title } from "rbx";
import firebase from "firebase/app";
import "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyC1Q_5hO_UWLcQRUT8DY-sm448Dqpenbbg",
  authDomain: "quickreact-9b03c.firebaseapp.com",
  databaseURL: "https://quickreact-9b03c.firebaseio.com",
  projectId: "quickreact-9b03c",
  storageBucket: "quickreact-9b03c.appspot.com",
  messagingSenderId: "728288735665",
  appId: "1:728288735665:web:20306a357a3f4de43b0d90"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database().ref();

const App = () => {
  const [schedule, setSchedule] = useState({ title: "", courses: [] });

  useEffect(() => {
    const handleData = snap => {
      if (snap.val()) setSchedule(addScheduleTimes(snap.val()));
    };
    db.on("value", handleData, error => alert(error));
    return () => {
      db.off("value", handleData);
    };
  }, []);

  return (
    <Container>
      <Banner title={schedule.title} />
      <CourseList courses={schedule.courses} />
    </Container>
  );
};
const useSelection = () => {
  const [selected, setSelected] = useState([]);
  const toggle = x => {
    setSelected(
      selected.includes(x)
        ? selected.filter(y => y !== x)
        : [x].concat(selected)
    );
  };
  return [selected, toggle];
};

const TermSelector = ({ state }) => (
  <Button.Group hasAddons>
    {Object.values(terms).map(value => (
      <Button
        key={value}
        color={buttonColor(value === state.term)}
        onClick={() => state.setTerm(value)}
      >
        {value}
      </Button>
    ))}
  </Button.Group>
);

const buttonColor = selected => (selected ? "success" : null);

const CourseList = ({ courses }) => {
  const [term, setTerm] = useState("Fall");
  const [selected, toggle] = useSelection();
  const termCourses = courses.filter(course => term === getCourseTerm(course));

  return (
    <React.Fragment>
      <TermSelector state={{ term, setTerm }} />
      <Button.Group>
        {termCourses.map(course => (
          <Course
            key={course.id}
            course={course}
            state={{ selected, toggle }}
          />
        ))}
      </Button.Group>
    </React.Fragment>
  );
};
const Banner = ({ title }) => <Title>{title || "[loading...]"}</Title>;

const terms = { F: "Fall", W: "Winter", S: "Spring" };

const getCourseTerm = course => terms[course.id.charAt(0)];

const getCourseNumber = course => course.id.slice(1, 4);

const meetsPat = /^ *((?:M|Tu|W|Th|F)+) +(\d\d?):(\d\d) *[ -] *(\d\d?):(\d\d) *$/;

const timeParts = meets => {
  const [match, days, hh1, mm1, hh2, mm2] = meetsPat.exec(meets) || [];
  return !match
    ? {}
    : {
        days,
        hours: {
          start: hh1 * 60 + mm1 * 1,
          end: hh2 * 60 + mm2 * 1
        }
      };
};
const addCourseTimes = course => ({
  ...course,
  ...timeParts(course.meets)
});

const addScheduleTimes = schedule => ({
  title: schedule.title,
  courses: Object.values(schedule.courses).map(addCourseTimes)
});

const days = ["M", "Tu", "W", "Th", "F"];
const daysOverlap = (days1, days2) =>
  days.some(day => days1.includes(day) && days2.includes(day));

const hoursOverlap = (hours1, hours2) =>
  Math.max(hours1.start, hours2.start) < Math.min(hours1.end, hours2.end);

const timeConflict = (course1, course2) =>
  daysOverlap(course1.days, course2.days) &&
  hoursOverlap(course1.hours, course2.hours);

const courseConflict = (course1, course2) =>
  course1 !== course2 &&
  getCourseTerm(course1) === getCourseTerm(course2) &&
  timeConflict(course1, course2);

const hasConflict = (course, selected) =>
  selected.some(selection => courseConflict(course, selection));

const moveCourse = course => {
  const meets = prompt("Enter new meeting data, in this format:", course.meets);
  if (!meets) return;
  const { days } = timeParts(meets);
  if (days) saveCourse(course, meets);
  else moveCourse(course);
};

const saveCourse = (course, meets) => {
  db.child("courses")
    .child(course.id)
    .update({ meets })
    .catch(error => alert(error));
};

const Course = ({ course, state }) => (
  <Button
    color={buttonColor(state.selected.includes(course))}
    onClick={() => state.toggle(course)}
    onDoubleClick={() => moveCourse(course)}
    disabled={hasConflict(course, state.selected)}
  >
    {getCourseTerm(course)} CS {getCourseNumber(course)}: {course.title}
  </Button>
);

export default App;
