import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Card, Image, Button, Modal, ProgressBar, Tab, Nav, Row, Col } from 'react-bootstrap';
import CroMagnonAvatar from '../../assets/avatars/cro-magnon-v1.webp';
import { ShoppingBag, Sword, Shield, Gift, Zap } from 'lucide-react';

export default function AvatarInfoPanel({ data = {}, onEditAvatar }) {
  const {
    nom = '',
    prenom = '',
    pseudo = '',
    poste = '',
    specialite = '',
    level = 1,
    xp = 0,
    contact = {},
    inventory = {},
  } = data;

  const [showContact, setShowContact] = useState(false);
  const [activeTab, setActiveTab] = useState('sac');

  const TABS = [
    { key: 'sac', icon: <ShoppingBag size={20} />, label: 'Sac' },
    { key: 'armes', icon: <Sword size={20} />, label: 'Armes' },
    { key: 'armures', icon: <Shield size={20} />, label: 'Armures' },
    { key: 'bijoux', icon: <Gift size={20} />, label: 'Bijoux' },
    { key: 'magie', icon: <Zap size={20} />, label: 'Magie' },
  ];

  // show up to 10 slots per category
  const slots = Array.from({ length: 10 }, (_, i) => inventory[activeTab]?.[i] || null);

  return (
    <>
      <Card className="avatar-info-panel">
        <Card.Body className="text-center">
          <Image
            src={data.avatarUrl || CroMagnonAvatar}
            roundedCircle
            fluid
            style={{ maxWidth: 120, marginBottom: '1rem', cursor: 'pointer' }}
            onClick={onEditAvatar}
            aria-label="Modifier l'avatar"
          />
          <h5 className="mb-1">
            {prenom} {pseudo && `"${pseudo}"`} {nom}
          </h5>
          {poste && <div className="text-muted mb-1">{poste}</div>}
          {specialite && <div className="mb-2">Spécialité : {specialite}</div>}

          <div className="mb-2">
            <strong>Niveau {level}</strong>
            <ProgressBar now={xp} label={`${xp}%`} className="mt-1" />
          </div>

          <Button variant="outline-primary" size="sm" onClick={() => setShowContact(true)}>
            Contact
          </Button>
        </Card.Body>

        <Card.Footer>
          <Tab.Container activeKey={activeTab} onSelect={setActiveTab}>
            <Nav variant="tabs" className="justify-content-center">
              {TABS.map((tab) => (
                <Nav.Item key={tab.key}>
                  <Nav.Link eventKey={tab.key}>{tab.icon}</Nav.Link>
                </Nav.Item>
              ))}
            </Nav>
            <Tab.Content className="mt-3">
              <Tab.Pane eventKey={activeTab}>
                <Row xs={5} className="g-2">
                  {slots.map((item, idx) => (
                    <Col key={idx} className="text-center">
                      <div className="inventory-slot">
                        {item ? (
                          <Image src={item.icon} thumbnail />
                        ) : (
                          <div className="empty-slot">—</div>
                        )}
                      </div>
                    </Col>
                  ))}
                </Row>
              </Tab.Pane>
            </Tab.Content>
          </Tab.Container>
        </Card.Footer>
      </Card>

      {/* Contact Modal */}
      <Modal show={showContact} onHide={() => setShowContact(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Contact</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {contact.phone && <p>Téléphone : {contact.phone}</p>}
          {contact.email && <p>E-mail : {contact.email}</p>}
          {contact.address && <p>Adresse : {contact.address}</p>}
          {!contact.phone && !contact.email && !contact.address && (
            <p className="text-muted">Aucune information de contact fournie.</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowContact(false)}>
            Fermer
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

AvatarInfoPanel.propTypes = {
  data: PropTypes.shape({
    avatarUrl: PropTypes.string,
    nom: PropTypes.string,
    prenom: PropTypes.string,
    pseudo: PropTypes.string,
    poste: PropTypes.string,
    specialite: PropTypes.string,
    level: PropTypes.number,
    xp: PropTypes.number,
    contact: PropTypes.shape({
      phone: PropTypes.string,
      email: PropTypes.string,
      address: PropTypes.string,
    }),
    inventory: PropTypes.objectOf(
      PropTypes.arrayOf(
        PropTypes.shape({
          icon: PropTypes.string, // URL to item icon
        }),
      ),
    ),
  }).isRequired,
  onEditAvatar: PropTypes.func.isRequired,
};
