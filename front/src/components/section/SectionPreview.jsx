// src/components/section/SectionPreview.jsx
import React from 'react';
import PropTypes from 'prop-types';

/**
 * Formatte une clé en label lisible (snake_case / camelCase -> Capitalized words).
 * Ex: "phone_number" -> "Phone number", "firstName" -> "First name"
 */
function formatLabel(key) {
  if (!key) return '';
  // split camelCase and snake/kebab
  const split = key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2') // camelCase -> space
    .replace(/[_-]+/g, ' ') // snake_case / kebab-case -> space
    .toLowerCase()
    .trim();
  return split.charAt(0).toUpperCase() + split.slice(1);
}

function isEmptyValue(v) {
  return v === null || v === undefined || (typeof v === 'string' && v.trim() === '');
}

/**
 * Render object content: only non-empty fields.
 */
function renderObject(obj) {
  if (!obj || typeof obj !== 'object') return null;
  const entries = Object.entries(obj)
    .filter(([, v]) => !isEmptyValue(v))
    .map(([k, v]) => (
      <li key={k}>
        <strong>{formatLabel(k)}:</strong>{' '}
        {typeof v === 'object'
          ? // for nested object, flatten values
            Array.isArray(v)
            ? v.filter((it) => !isEmptyValue(it)).join(' — ') || <em>Aucun contenu</em>
            : JSON.stringify(v)
          : String(v)}
      </li>
    ));

  if (entries.length === 0) return <em>Aucun contenu</em>;
  return <ul className="section-preview-list">{entries}</ul>;
}

/**
 * Render array content: either primitives or objects.
 */
function renderArray(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return <em>Aucun contenu</em>;

  // detect array of objects vs array of primitives
  const firstNonEmpty = arr.find((it) => !isEmptyValue(it));
  if (!firstNonEmpty) return <em>Aucun contenu</em>;

  if (typeof firstNonEmpty === 'object') {
    return (
      <ul className="section-preview-list">
        {arr
          .map((item, idx) => {
            if (!item || typeof item !== 'object') return null;
            // clean item
            const parts = Object.entries(item)
              .filter(([, v]) => !isEmptyValue(v))
              .map(([k, v]) => (
                <div key={k} className="item-field">
                  <strong>{formatLabel(k)}:</strong> {String(v)}
                </div>
              ));
            if (parts.length === 0) return null;
            return (
              <li key={idx} className="section-preview-multi">
                {parts}
              </li>
            );
          })
          .filter(Boolean)}
      </ul>
    );
  }

  // primitives
  const primitives = arr.filter((it) => !isEmptyValue(it));
  if (primitives.length === 0) return <em>Aucun contenu</em>;
  return (
    <ul className="section-preview-list">
      {primitives.map((it, i) => (
        <li key={i}>{String(it)}</li>
      ))}
    </ul>
  );
}

/**
 * Aperçu en lecture seule du contenu d’une section.
 *
 * @param {any} data      Contenu de la section (objet, tableau, string ou number)
 */
export default function SectionPreview({ data }) {
  // nothing meaningful
  if (isEmptyValue(data)) {
    return (
      <div className="preview-card">
        <div className="preview-body">
          <em>Aucun contenu</em>
        </div>
      </div>
    );
  }

  let content = null;
  if (Array.isArray(data)) {
    content = renderArray(data);
  } else if (typeof data === 'object') {
    content = renderObject(data);
  } else {
    // primitive
    content = <div>{String(data)}</div>;
  }

  return (
    <div className="preview-card">
      <div className="preview-body">{content}</div>
    </div>
  );
}

SectionPreview.propTypes = {
  // type prop existed previously in your code but Dashboard passes at least data.
  // keep only data here — if you need type later you can add it back.
  data: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.array,
    PropTypes.string,
    PropTypes.number,
  ]),
};

SectionPreview.defaultProps = {
  data: null,
};
