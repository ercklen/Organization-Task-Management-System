import { describe, it, expect } from "vitest";
import fr from "../messages/fr.json";
import ar from "../messages/ar.json";

function getDeepKeys(obj: any, prefix = ""): string[] {
  return Object.keys(obj).reduce((res: string[], el: string) => {
    const newPrefix = prefix ? `${prefix}.${el}` : el;
    if (typeof obj[el] === "object" && obj[el] !== null && !Array.isArray(obj[el])) {
      res.push(...getDeepKeys(obj[el], newPrefix));
    } else {
      res.push(newPrefix);
    }
    return res;
  }, []);
}

describe("Bilingual Internationalization (i18n)", () => {
  it("should have matching translation keys between French and Arabic dictionaries", () => {
    const frKeys = getDeepKeys(fr).sort();
    const arKeys = getDeepKeys(ar).sort();

    // Check for keys in FR that are missing in AR
    const missingInAr = frKeys.filter((key) => !arKeys.includes(key));
    // Check for keys in AR that are missing in FR
    const missingInFr = arKeys.filter((key) => !frKeys.includes(key));

    expect(missingInAr).toEqual([]);
    expect(missingInFr).toEqual([]);
    expect(frKeys.length).toBe(arKeys.length);
  });

  it("should have all required common and task navigation keys", () => {
    expect(fr.nav.dashboard).toBe("Tableau de bord");
    expect(ar.nav.dashboard).toBe("لوحة التحكم");

    expect(fr.nav.tasks).toBe("Tâches");
    expect(ar.nav.tasks).toBe("المهام");

    expect(fr.nav.groups).toBe("Groupes");
    expect(ar.nav.groups).toBe("المجموعات");

    expect(fr.nav.students).toBe("Étudiants");
    expect(ar.nav.students).toBe("الطلاب");

    expect(fr.tasks.priorities.urgent).toBe("Urgente");
    expect(ar.tasks.priorities.urgent).toBe("عاجلة");
  });

  it("should have proper structured notification message keys with placeholders", () => {
    expect(fr.notifications.taskCompleted).toContain("{student_name}");
    expect(fr.notifications.taskCompleted).toContain("{task_title}");

    expect(ar.notifications.taskCompleted).toContain("{student_name}");
    expect(ar.notifications.taskCompleted).toContain("{task_title}");
  });
});
