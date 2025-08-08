// utils/scrollToSection.ts
export const scrollToSection = (sectionName: string) => {
  const sectionId = sectionName.replace(/\s+/g, '-').toLowerCase();
  const sectionElement = document.getElementById(sectionId);
  if (sectionElement) {
    const headerOffset = 100; // Ajuste este valor se o seu menu pegajoso for maior
    const elementPosition = sectionElement.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.scrollY - headerOffset;

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
  }
};