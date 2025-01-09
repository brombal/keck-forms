import { useForm } from 'keck-forms/useForm';
import { useFormContext } from 'keck-forms/useFormContext';
import { zodValidator } from 'keck-forms/zodValidator';
import { useState } from 'react';
import { z } from 'zod';

enum SkillLevel {
  Beginner = 'beginner',
  Intermediate = 'intermediate',
  Advanced = 'advanced',
}

const jobApplicationSchema = z.object({
  profile: z.object({
    name: z.string(),
    email: z.string().email(),
    phone: z.string().regex(/^\d{10}$/),
  }),

  skills: z.array(
    z.object({
      name: z.string(),
      level: z.nativeEnum(SkillLevel),
    }),
  ),

  workHistory: z.array(
    z.object({
      company: z.string(),
      position: z.string(),
      startDate: z.date().nullable(),
      endDate: z.date().nullable(),
    }),
  ),

  references: z.array(
    z.object({
      name: z.string(),
      email: z.string().email(),
      phone: z.string().regex(/^\d{10}$/),
    }),
  ),
});

type JobApplicationInput = z.input<typeof jobApplicationSchema>;
type JobApplicationOutput = z.output<typeof jobApplicationSchema>;

const initialJobApplicationForm: JobApplicationInput = {
  profile: {
    name: '',
    email: '',
    phone: '',
  },
  workHistory: [],
  skills: [],
  references: [],
};

function useJobApplicationForm() {
  return useFormContext<JobApplicationInput, JobApplicationOutput>();
}

function JobApplication() {
  const { field, FormProvider } = useForm<JobApplicationInput, JobApplicationOutput>({
    initial: initialJobApplicationForm,
    validate: zodValidator(jobApplicationSchema),
  });

  return (
    <FormProvider>
      <section>
        <h2>Profile</h2>

        {/* Example of using raw inputs */}
        <input
          value={field('profile.name').value}
          onChange={(e) => (field('profile.name').value = e.target.value)}
          onBlur={() => (field('profile.name').touched = true)}
        />
        <input
          value={field('profile.email').value}
          onChange={(e) => (field('profile.email').value = e.target.value)}
          onBlur={() => (field('profile.email').touched = true)}
        />
        <input
          value={field('profile.phone').value}
          onChange={(e) => (field('profile.phone').value = e.target.value)}
          onBlur={() => (field('profile.phone').touched = true)}
        />
      </section>

      <SkillsForm />
      <WorkHistoryForm />
      <ReferencesForm />
    </FormProvider>
  );
}

/**
 * An example form sub-component using raw inputs.
 */
function SkillsForm() {
  const { field } = useJobApplicationForm();

  const skillsField = field('skills');

  return (
    <section>
      <h2>Skills</h2>

      {skillsField.map((_skillField, i) => (
        <div key={i.toString()}>
          <TextField field={`skills.${i}.name`} />
          <Dropdown field={`skills.${i}.level`} options={Object.values(SkillLevel)} />
        </div>
      ))}
      <button type="button">Add Skill</button>
    </section>
  );
}

// Reusable field examples

function TextField(props: { field: string }) {
  const { field } = useFormContext();

  const inputField = field<string>(props.field);

  return (
    <>
      <input
        value={inputField.value}
        onChange={(e) => (inputField.value = e.target.value)}
        onBlur={() => (inputField.touched = true)}
      />
      <ErrorMessages field={props.field} />
    </>
  );
}

function Dropdown<T extends string>(props: { field: string; options: T[] }) {
  const { field } = useFormContext();

  const dropdownField = field<T>(props.field);

  return (
    <>
      <select
        value={dropdownField.value}
        onChange={(e) => (dropdownField.value = e.target.value as T)}
        onBlur={() => (dropdownField.touched = true)}
      >
        {props.options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <ErrorMessages field={props.field} />
    </>
  );
}

/**
 * A date input. Uses internal state to track the actual input value (which may be an invalid date at any given point),
 * and sets the form field value to a valid Date object when the string is valid, or null otherwise.
 */
function DateInput(props: { field: string }) {
  const { field } = useFormContext();

  const dateField = field<Date | null>(props.field);

  const [inputValue, setInputValue] = useState(dateField.value?.toDateString() || '');

  return (
    <>
      <input
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value);
          const parsedDate = new Date(e.target.value);
          dateField.value = Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
        }}
      />
      <ErrorMessages field={props.field} />
    </>
  );
}

/**
 * Displays all error messages associated with the given field. Only displays errors if the field is touched.
 */
function ErrorMessages(props: { field: string }) {
  const { field } = useFormContext();

  const errorField = field(props.field);

  return errorField.touched && errorField.errors.length ? (
    <div>
      {errorField.errors.map((error) => (
        <div key={error}>{error}</div>
      ))}
    </div>
  ) : null;
}

/**
 * An example form sub-component using reusable fields.
 */
function WorkHistoryForm() {
  const { field } = useJobApplicationForm();

  const workHistoryFieldList = field('workHistory');

  return (
    <section>
      <h2>Work History</h2>

      {workHistoryFieldList.map((workField, i) => (
        <div key={i}>
          <TextField
            // field set using full path and index:
            field={`workHistory.${i}.company`}
          />
          <TextField
            // field set using parent field path:
            field={`${workField.path}.position`}
          />
          <DateInput field={`${workField.path}.startDate`} />
          <DateInput field={`${workField.path}.endDate`} />
        </div>
      ))}

      <button
        type="button"
        onClick={() => {
          workHistoryFieldList.push({
            company: '',
            position: '',
            startDate: null,
            endDate: null,
          });
        }}
      >
        Add Job
      </button>
    </section>
  );
}

/**
 * An example form sub-component using reusable fields.
 */
function ReferencesForm() {
  const { field } = useJobApplicationForm();

  const referencesFieldList = field('references');

  return (
    <section>
      <h2>References</h2>

      {referencesFieldList.map((_, i) => (
        <div key={i.toString()}>
          <TextField field={`references.${i}.name`} />
          <TextField field={`references.${i}.email`} />
          <TextField field={`references.${i}.phone`} />
        </div>
      ))}

      <button
        type="button"
        onClick={() => {
          referencesFieldList.push({
            name: '',
            email: '',
            phone: '',
          });
        }}
      >
        Add Reference
      </button>
    </section>
  );
}
